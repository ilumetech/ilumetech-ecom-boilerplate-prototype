import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StockMovementType,
  type StockMovement as PrismaStockMovement,
} from '@prisma/client';
import type {
  PaginatedResponse,
  StockMovement,
  StockVariant,
} from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import type {
  CreateStockMovementDto,
  StockMovementQueryDto,
  StockVariantQueryDto,
} from './dto';

type StockVariantWithProduct = Prisma.ProductVariantGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        code: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async findVariants(
    query: StockVariantQueryDto,
  ): Promise<PaginatedResponse<StockVariant>> {
    const filters: Record<string, unknown> = {};
    if (query.isActive !== undefined) filters.isActive = query.isActive;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['sku', 'name'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['sku', 'name', 'stockOnHand', 'createdAt'],
      page: query.page,
      limit: query.limit,
    });

    const [variants, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return {
      data: variants.map((variant) => this.mapVariantToResponse(variant)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async findMovements(
    productVariantId: string,
    query: StockMovementQueryDto,
  ): Promise<PaginatedResponse<StockMovement>> {
    await this.ensureVariantExists(productVariantId);

    const filters: Record<string, unknown> = {
      productVariantId,
      type: query.type,
      referenceType: query.referenceType,
      referenceId: query.referenceId,
    };

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['reason', 'note', 'referenceId'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['createdAt', 'type', 'quantity'],
      page: query.page,
      limit: query.limit,
    });

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        skip,
        take,
        where,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements.map((movement) => this.mapMovementToResponse(movement)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async createMovement(
    productVariantId: string,
    dto: CreateStockMovementDto,
    actorId: string,
  ): Promise<StockMovement> {
    this.validateMovement(dto);

    const movement = await this.prisma.$transaction(async (tx) => {
      const { balanceBefore, balanceAfter, movementQuantity } =
        await this.applyStockChange(tx, productVariantId, dto);

      return tx.stockMovement.create({
        data: {
          productVariantId,
          type: dto.type,
          quantity: movementQuantity,
          balanceBefore,
          balanceAfter,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          reason: dto.reason,
          note: dto.note,
          actorId,
        },
      });
    });

    return this.mapMovementToResponse(movement);
  }

  private validateMovement(dto: CreateStockMovementDto): void {
    if (!Number.isInteger(dto.quantity) || dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }
  }

  private readonly IN_TYPES: Set<StockMovementType> = new Set([
    StockMovementType.IN,
    StockMovementType.MANUAL_IN,
    StockMovementType.OPNAME_IN,
    StockMovementType.TRANSFER_IN,
  ]);

  private readonly OUT_TYPES: Set<StockMovementType> = new Set([
    StockMovementType.OUT,
    StockMovementType.MANUAL_OUT,
    StockMovementType.OPNAME_OUT,
    StockMovementType.TRANSFER_OUT,
    StockMovementType.WRITE_OFF,
  ]);

  private async applyStockChange(
    tx: Prisma.TransactionClient,
    productVariantId: string,
    dto: CreateStockMovementDto,
  ): Promise<{
    balanceBefore: number;
    balanceAfter: number;
    movementQuantity: number;
  }> {
    if (this.IN_TYPES.has(dto.type)) {
      return this.applyStockIn(tx, productVariantId, dto.quantity);
    }

    if (this.OUT_TYPES.has(dto.type)) {
      return this.applyStockOut(tx, productVariantId, dto.quantity);
    }

    throw new BadRequestException(`Unsupported movement type: ${dto.type}`);
  }

  private async applyStockIn(
    tx: Prisma.TransactionClient,
    productVariantId: string,
    quantity: number,
  ): Promise<{
    balanceBefore: number;
    balanceAfter: number;
    movementQuantity: number;
  }> {
    const updatedVariant = await tx.productVariant.update({
      where: { id: productVariantId },
      data: { stockOnHand: { increment: quantity } },
      select: { stockOnHand: true },
    });

    return {
      balanceBefore: updatedVariant.stockOnHand - quantity,
      balanceAfter: updatedVariant.stockOnHand,
      movementQuantity: quantity,
    };
  }

  private async applyStockOut(
    tx: Prisma.TransactionClient,
    productVariantId: string,
    quantity: number,
  ): Promise<{
    balanceBefore: number;
    balanceAfter: number;
    movementQuantity: number;
  }> {
    const result = await tx.productVariant.updateMany({
      where: { id: productVariantId, stockOnHand: { gte: quantity } },
      data: { stockOnHand: { decrement: quantity } },
    });

    if (result.count === 0) {
      await this.ensureVariantExists(productVariantId, tx);
      throw new BadRequestException('Insufficient stock');
    }

    const updatedVariant = await tx.productVariant.findUniqueOrThrow({
      where: { id: productVariantId },
      select: { stockOnHand: true },
    });

    return {
      balanceBefore: updatedVariant.stockOnHand + quantity,
      balanceAfter: updatedVariant.stockOnHand,
      movementQuantity: quantity,
    };
  }

  private async ensureVariantExists(
    productVariantId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const variant = await tx.productVariant.findUnique({
      where: { id: productVariantId },
      select: { id: true },
    });

    if (!variant)
      throw new NotFoundException(`Variant ${productVariantId} not found`);
  }

  private mapVariantToResponse(variant: StockVariantWithProduct): StockVariant {
    return {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      stockOnHand: variant.stockOnHand,
      isActive: variant.isActive,
      product: variant.product,
    };
  }

  private mapMovementToResponse(movement: PrismaStockMovement): StockMovement {
    return {
      id: movement.id,
      productVariantId: movement.productVariantId,
      type: movement.type,
      quantity: movement.quantity,
      balanceBefore: movement.balanceBefore,
      balanceAfter: movement.balanceAfter,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      reason: movement.reason,
      note: movement.note,
      actorId: movement.actorId,
      createdAt: movement.createdAt.toISOString(),
    };
  }
}
