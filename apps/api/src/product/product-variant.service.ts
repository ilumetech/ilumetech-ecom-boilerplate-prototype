import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
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
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found for this product`);
    return variant;
  }

  async create(productId: string, dto: CreateProductVariantDto) {
    // 1. Check SKU uniqueness
    const existingSku = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) throw new BadRequestException(`SKU ${dto.sku} is already in use`);

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
      throw new BadRequestException('One or more option values do not belong to this product');
    }

    // 3. Validate one value per option
    const optionIds = optionValues.map((ov) => ov.optionId);
    if (new Set(optionIds).size !== optionIds.length) {
      throw new BadRequestException('Each variant must have at most one value per option');
    }

    // 4. Validate unique combination per product
    const allVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      include: { optionValues: true },
    });

    const newCombo = new Set(optionValueIds);
    for (const v of allVariants) {
      const vCombo = new Set(v.optionValues.map((ov) => ov.optionValueId));
      if (vCombo.size === newCombo.size && [...vCombo].every((id) => newCombo.has(id))) {
        throw new BadRequestException('A variant with this option combination already exists');
      }
    }

    // 5. Handle isDefault
    if (dto.isDefault) {
      await this.prisma.productVariant.updateMany({
        where: { productId, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      const firstVariant = await this.prisma.productVariant.findFirst({
        where: { productId },
      });
      if (!firstVariant) {
        dto.isDefault = true;
      }
    }

    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        name: dto.name,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        imageUrl: dto.imageUrl,
        isDefault: dto.isDefault ?? false,
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

  async update(productId: string, variantId: string, dto: UpdateProductVariantDto) {
    const variant = await this.findOne(productId, variantId);

    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.prisma.productVariant.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) throw new BadRequestException(`SKU ${dto.sku} is already in use`);
    }

    if (dto.optionValueIds) {
      const optionValues = await this.prisma.productOptionValue.findMany({
        where: {
          id: { in: dto.optionValueIds },
          option: { productId },
        },
      });

      if (optionValues.length !== dto.optionValueIds.length) {
        throw new BadRequestException('One or more option values do not belong to this product');
      }

      const optionIds = optionValues.map((ov) => ov.optionId);
      if (new Set(optionIds).size !== optionIds.length) {
        throw new BadRequestException('Each variant must have at most one value per option');
      }

      const otherVariants = await this.prisma.productVariant.findMany({
        where: { productId, id: { not: variantId } },
        include: { optionValues: true },
      });

      const newCombo = new Set(dto.optionValueIds);
      for (const v of otherVariants) {
        const vCombo = new Set(v.optionValues.map((ov) => ov.optionValueId));
        if (vCombo.size === newCombo.size && [...vCombo].every((id) => newCombo.has(id))) {
          throw new BadRequestException('A variant with this option combination already exists');
        }
      }
    }

    if (dto.isDefault && !variant.isDefault) {
      await this.prisma.productVariant.updateMany({
        where: { productId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const { optionValueIds, ...updateData } = dto;

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...updateData,
        optionValues: optionValueIds ? {
          deleteMany: {},
          create: optionValueIds.map((id) => ({
            optionValueId: id,
          })),
        } : undefined,
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
}
