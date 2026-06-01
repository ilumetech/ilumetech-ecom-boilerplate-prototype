import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiscountType,
  Prisma,
  StockMovementType,
  StockReferenceType,
} from '@prisma/client';
import type { Order, OrderAddress, PaginatedResponse } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import type { CreateOrderDto, QueryOrderDto } from './dto';

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

type CheckoutVariant = Prisma.ProductVariantGetPayload<{
  include: {
    product: {
      include: {
        images: true;
      };
    };
    optionValues: {
      include: {
        optionValue: {
          include: {
            option: true;
          };
        };
      };
    };
  };
}>;

interface DiscountCalculation {
  code: string | null;
  amount: number;
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<Order> {
    this.validateDuplicateItems(dto.items.map((item) => item.productVariantId));

    const order = await this.prisma.$transaction(async (tx) => {
      await this.ensureCustomer(tx, customerId, dto);

      const variants = await this.getCheckoutVariants(
        tx,
        dto.items.map((item) => item.productVariantId),
      );

      const variantById = new Map(
        variants.map((variant) => [variant.id, variant]),
      );

      const orderItems = dto.items.map((item) => {
        const variant = variantById.get(item.productVariantId);
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.productVariantId} is unavailable`,
          );
        }

        if (variant.stockOnHand < item.quantity) {
          throw new BadRequestException(
            `${variant.product.name} - ${variant.name} has insufficient stock`,
          );
        }

        const unitPrice = variant.finalPrice.toNumber();
        return {
          dto: item,
          variant,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      });

      const subtotalAmount = orderItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );
      const discount = await this.calculateDiscount(
        tx,
        dto.promoCode,
        subtotalAmount,
      );
      const shippingAmount = dto.shippingAmount ?? 0;
      const totalAmount = Math.max(
        0,
        subtotalAmount - discount.amount + shippingAmount,
      );
      const orderNumber = await this.generateOrderNumber(tx);

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          customerEmail: dto.customerEmail,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          subtotalAmount,
          discountAmount: discount.amount,
          shippingAmount,
          totalAmount,
          promoCode: discount.code,
          shippingMethod: dto.shippingMethod,
          shippingAddress: this.toShippingAddressJson(dto.shippingAddress),
          items: {
            create: orderItems.map((item) => ({
              productId: item.variant.productId,
              productVariantId: item.variant.id,
              productName: item.variant.product.name,
              variantName: item.variant.name,
              sku: item.variant.sku,
              imageUrl:
                item.variant.imageUrl ?? item.variant.product.images[0]?.url,
              optionSummary: this.buildOptionSummary(item.variant),
              unitPrice: item.unitPrice,
              quantity: item.dto.quantity,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of orderItems) {
        await this.decrementStock(tx, {
          productVariantId: item.variant.id,
          quantity: item.dto.quantity,
          orderId: created.id,
          actorId: customerId,
        });
      }

      if (discount.code) {
        await this.incrementPromoUsage(tx, discount.code);
      }

      return created;
    });

    return this.mapToResponse(order);
  }

  async findAll(query: QueryOrderDto): Promise<PaginatedResponse<Order>> {
    const filters: Record<string, unknown> = {};
    if (query.status) filters.status = query.status;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['orderNumber', 'customerEmail', 'customerName'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['orderNumber', 'createdAt', 'totalAmount', 'status'],
      page: query.page,
      limit: query.limit,
    });

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take,
        where,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.mapToResponse(order)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundException(`Order ${id} not found`);

    return this.mapToResponse(order);
  }

  async findCustomerOrders(
    customerId: string,
    query: QueryOrderDto,
  ): Promise<PaginatedResponse<Order>> {
    const filters: Record<string, unknown> = { customerId };
    if (query.status) filters.status = query.status;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['orderNumber'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['orderNumber', 'createdAt', 'totalAmount', 'status'],
      page: query.page,
      limit: query.limit,
    });

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take,
        where,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.mapToResponse(order)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  private validateDuplicateItems(productVariantIds: string[]): void {
    const uniqueIds = new Set(productVariantIds);
    if (uniqueIds.size !== productVariantIds.length) {
      throw new BadRequestException('Duplicate variants are not allowed');
    }
  }

  private async ensureCustomer(
    tx: Prisma.TransactionClient,
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<void> {
    const [firstName, ...lastNameParts] = dto.customerName.trim().split(' ');

    await tx.customer.upsert({
      where: { id: customerId },
      update: {
        email: dto.customerEmail,
        firstName: firstName || null,
        lastName: lastNameParts.join(' ') || null,
      },
      create: {
        id: customerId,
        email: dto.customerEmail,
        firstName: firstName || null,
        lastName: lastNameParts.join(' ') || null,
      },
    });
  }

  private async getCheckoutVariants(
    tx: Prisma.TransactionClient,
    productVariantIds: string[],
  ): Promise<CheckoutVariant[]> {
    return tx.productVariant.findMany({
      where: {
        id: { in: productVariantIds },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        },
        optionValues: {
          include: {
            optionValue: {
              include: {
                option: true,
              },
            },
          },
        },
      },
    });
  }

  private async calculateDiscount(
    tx: Prisma.TransactionClient,
    code: string | undefined,
    subtotal: number,
  ): Promise<DiscountCalculation> {
    if (!code?.trim()) return { code: null, amount: 0 };

    const codeUpper = code.trim().toUpperCase();
    const promo = await tx.promoCode.findUnique({
      where: { code: codeUpper },
    });

    if (!promo) throw new BadRequestException('Kode promo tidak valid');
    if (!promo.isActive) {
      throw new BadRequestException('Kode promo sudah tidak aktif');
    }

    const now = new Date();
    if (promo.startDate && now < promo.startDate) {
      throw new BadRequestException('Periode promo belum dimulai');
    }

    if (promo.endDate && now > promo.endDate) {
      throw new BadRequestException('Kode promo sudah kadaluwarsa');
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Batas penggunaan kode promo telah habis');
    }

    const minOrderAmount = promo.minOrderAmount.toNumber();
    if (subtotal < minOrderAmount) {
      throw new BadRequestException(
        `Minimal pembelian untuk promo ini adalah Rp ${minOrderAmount.toLocaleString(
          'id-ID',
        )}`,
      );
    }

    const discountValue = promo.discountValue.toNumber();
    let amount =
      promo.discountType === DiscountType.PERCENTAGE
        ? Math.round((subtotal * discountValue) / 100)
        : discountValue;

    if (
      promo.discountType === DiscountType.PERCENTAGE &&
      promo.maxDiscount !== null
    ) {
      amount = Math.min(amount, promo.maxDiscount.toNumber());
    }

    return { code: promo.code, amount: Math.min(amount, subtotal) };
  }

  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const counter = await tx.productCounter.upsert({
      where: { prefix: 'ORD' },
      update: { lastSeq: { increment: 1 } },
      create: { prefix: 'ORD', lastSeq: 1 },
    });

    return `${counter.prefix}-${String(counter.lastSeq).padStart(8, '0')}`;
  }

  private async decrementStock(
    tx: Prisma.TransactionClient,
    params: {
      productVariantId: string;
      quantity: number;
      orderId: string;
      actorId: string;
    },
  ): Promise<void> {
    const result = await tx.productVariant.updateMany({
      where: {
        id: params.productVariantId,
        stockOnHand: { gte: params.quantity },
      },
      data: {
        stockOnHand: { decrement: params.quantity },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedVariant = await tx.productVariant.findUniqueOrThrow({
      where: { id: params.productVariantId },
      select: { stockOnHand: true },
    });

    await tx.stockMovement.create({
      data: {
        productVariantId: params.productVariantId,
        type: StockMovementType.OUT,
        quantity: params.quantity,
        balanceBefore: updatedVariant.stockOnHand + params.quantity,
        balanceAfter: updatedVariant.stockOnHand,
        referenceType: StockReferenceType.ORDER,
        referenceId: params.orderId,
        reason: 'Order checkout',
        actorId: params.actorId,
      },
    });
  }

  private async incrementPromoUsage(
    tx: Prisma.TransactionClient,
    code: string,
  ): Promise<void> {
    const promo = await tx.promoCode.findUniqueOrThrow({ where: { code } });
    const result = await tx.promoCode.updateMany({
      where: {
        code,
        ...(promo.usageLimit !== null
          ? { usedCount: { lt: promo.usageLimit } }
          : {}),
      },
      data: {
        usedCount: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Batas penggunaan kode promo telah habis');
    }
  }

  private buildOptionSummary(variant: CheckoutVariant): string | null {
    if (variant.optionValues.length === 0) return null;

    return [...variant.optionValues]
      .sort(
        (a, b) =>
          a.optionValue.option.position - b.optionValue.option.position ||
          a.optionValue.option.name.localeCompare(b.optionValue.option.name),
      )
      .map(
        (item) => `${item.optionValue.option.name}: ${item.optionValue.value}`,
      )
      .join(' / ');
  }

  private toShippingAddressJson(address: OrderAddress): Prisma.InputJsonObject {
    return {
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      ...(address.addressLine2 && { addressLine2: address.addressLine2 }),
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
  }

  private mapShippingAddress(value: Prisma.JsonValue): OrderAddress {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Invalid order shipping address');
    }

    const address = value as Record<string, unknown>;

    return {
      firstName: this.readString(address.firstName),
      lastName: this.readString(address.lastName),
      addressLine1: this.readString(address.addressLine1),
      addressLine2:
        typeof address.addressLine2 === 'string'
          ? address.addressLine2
          : undefined,
      city: this.readString(address.city),
      province: this.readString(address.province),
      postalCode: this.readString(address.postalCode),
      country: this.readString(address.country),
    };
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private mapToResponse(order: OrderWithItems): Order {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      subtotalAmount: order.subtotalAmount.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      shippingAmount: order.shippingAmount.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      promoCode: order.promoCode,
      shippingMethod: order.shippingMethod,
      shippingAddress: this.mapShippingAddress(order.shippingAddress),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        imageUrl: item.imageUrl,
        optionSummary: item.optionSummary,
        unitPrice: item.unitPrice.toNumber(),
        quantity: item.quantity,
        lineTotal: item.lineTotal.toNumber(),
        createdAt: item.createdAt.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
