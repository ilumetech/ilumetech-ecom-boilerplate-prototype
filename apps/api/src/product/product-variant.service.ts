import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto';
import { buildVariantPricingData } from './product-variant.utils';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId, isActive: true },
      include: {
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      include: {
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
    if (!variant)
      throw new NotFoundException(
        `Variant ${variantId} not found for this product`,
      );
    return variant;
  }

  async create(productId: string, dto: CreateProductVariantDto) {
    // 1. Check SKU uniqueness
    const existingSku = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku)
      throw new BadRequestException(`SKU ${dto.sku} is already in use`);

    // 2. Validate option values belong to the same product
    const optionValueIds = dto.optionValueIds ?? [];
    const optionValues = await this.prisma.productOptionValue.findMany({
      where: {
        id: { in: optionValueIds },
        option: { productId },
      },
      include: { option: true },
    });

    if (optionValues.length !== optionValueIds.length) {
      throw new BadRequestException(
        'One or more option values do not belong to this product',
      );
    }

    // 3. Validate one value per option
    const optionIds = optionValues.map((ov) => ov.optionId);
    if (new Set(optionIds).size !== optionIds.length) {
      throw new BadRequestException(
        'Each variant must have at most one value per option',
      );
    }

    // 4. Validate unique combination per product
    const allVariants = await this.prisma.productVariant.findMany({
      where: { productId, isActive: true },
      include: { optionValues: true },
    });

    const newCombo = new Set(optionValueIds);
    for (const v of allVariants) {
      const vCombo = new Set(v.optionValues.map((ov) => ov.optionValueId));
      if (
        vCombo.size === newCombo.size &&
        [...vCombo].every((id) => newCombo.has(id))
      ) {
        throw new BadRequestException(
          'A variant with this option combination already exists',
        );
      }
    }

    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        name: dto.name,
        ...buildVariantPricingData(dto),
        compareAtPrice: dto.compareAtPrice,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
        optionValues: {
          create: optionValueIds.map((id) => ({
            optionValueId: id,
          })),
        },
      },
      include: {
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
  }

  async update(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    const variant = await this.findOne(productId, variantId);

    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.prisma.productVariant.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku)
        throw new BadRequestException(`SKU ${dto.sku} is already in use`);
    }

    if (dto.optionValueIds) {
      const optionValues = await this.prisma.productOptionValue.findMany({
        where: {
          id: { in: dto.optionValueIds },
          option: { productId },
        },
      });

      if (optionValues.length !== dto.optionValueIds.length) {
        throw new BadRequestException(
          'One or more option values do not belong to this product',
        );
      }

      const optionIds = optionValues.map((ov) => ov.optionId);
      if (new Set(optionIds).size !== optionIds.length) {
        throw new BadRequestException(
          'Each variant must have at most one value per option',
        );
      }

      const otherVariants = await this.prisma.productVariant.findMany({
        where: { productId, id: { not: variantId }, isActive: true },
        include: { optionValues: true },
      });

      const newCombo = new Set(dto.optionValueIds);
      for (const v of otherVariants) {
        const vCombo = new Set(v.optionValues.map((ov) => ov.optionValueId));
        if (
          vCombo.size === newCombo.size &&
          [...vCombo].every((id) => newCombo.has(id))
        ) {
          throw new BadRequestException(
            'A variant with this option combination already exists',
          );
        }
      }
    }

    const {
      optionValueIds,
      price,
      finalPrice,
      discountType,
      discountValue,
      discountMode,
      ...updateData
    } = dto;

    const pricingData = this.buildUpdateVariantPricingData(variant, {
      price,
      finalPrice,
      discountType,
      discountValue,
      discountMode,
    });

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...updateData,
        ...pricingData,
        optionValues: optionValueIds
          ? {
              deleteMany: {},
              create: optionValueIds.map((id) => ({
                optionValueId: id,
              })),
            }
          : undefined,
      },
      include: {
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
  }

  async remove(productId: string, variantId: string) {
    await this.findOne(productId, variantId);
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
  }

  private buildUpdateVariantPricingData(
    variant: Awaited<ReturnType<ProductVariantService['findOne']>>,
    dto: Pick<
      UpdateProductVariantDto,
      'price' | 'finalPrice' | 'discountType' | 'discountValue' | 'discountMode'
    >,
  ) {
    const hasPricingChange = Object.values(dto).some(
      (value) => value !== undefined,
    );
    if (!hasPricingChange) return {};

    const price = dto.price ?? variant.price.toNumber();
    const finalPrice = dto.finalPrice ?? variant.finalPrice.toNumber();
    const discountType =
      dto.discountType !== undefined ? dto.discountType : variant.discountType;
    const discountMode =
      dto.discountMode !== undefined ? dto.discountMode : variant.discountMode;
    const discountValue =
      discountType === null
        ? null
        : dto.discountValue !== undefined
          ? dto.discountValue
          : (variant.discountValue?.toNumber() ?? null);

    return buildVariantPricingData({
      sku: variant.sku,
      name: variant.name,
      price,
      finalPrice,
      discountType,
      discountValue,
      discountMode,
    });
  }
}
