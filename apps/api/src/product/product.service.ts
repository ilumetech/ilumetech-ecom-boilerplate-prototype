import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PaginatedResponse, Product } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  buildPaginationMeta,
  buildPrismaQuery,
  slugify,
} from '../common/utils';

import type {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    productCategory: true;
    color: true;
    unit: true;
    images: true;
    options: {
      include: {
        values: true;
      };
    };
    variants: {
      include: {
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
    };
  };
}>;

const PRODUCT_INCLUDE = {
  productCategory: true,
  color: true,
  unit: true,
  images: true,
  options: {
    include: {
      values: {
        orderBy: {
          position: 'asc' as const,
        },
      },
    },
    orderBy: {
      position: 'asc' as const,
    },
  },
  variants: {
    include: {
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
  },
} as const;

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: QueryProductDto): Promise<PaginatedResponse<Product>> {
    const filters: Record<string, unknown> = {};
    if (query.productCategoryId)
      filters.productCategoryId = query.productCategoryId;
    if (query.colorId) filters.colorId = query.colorId;
    if (query.isActive !== undefined) filters.isActive = query.isActive;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['name', 'code'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['name', 'code', 'isActive', 'createdAt'],
      page: query.page,
      limit: query.limit,
    });

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        orderBy,
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.mapToResponse(p)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!product) throw new NotFoundException(`Product ${id} not found`);

    return this.mapToResponse(product);
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.productCounter.update({
        where: { prefix: 'PRD' },
        data: { lastSeq: { increment: 1 } },
      });

      const code = this.formatCode(counter.prefix, counter.lastSeq);
      const slug = await this.generateUniqueSlug(dto.name, tx);

      const product = await tx.product.create({
        data: {
          code,
          name: dto.name,
          slug,
          description: dto.description,
          colorId: dto.colorId,
          badge: dto.badge,
          productCategoryId: dto.productCategoryId,
          unitId: dto.unitId,
          sellingPrice: dto.sellingPrice,
          purchasePrice: dto.purchasePrice,
          weightGram: dto.weightGram,
          isActive: dto.isActive ?? true,
        },
      });

      const productId = product.id;
      const tempIdMap: Record<string, string> = {};

      // 1. Create Options and Values
      if (dto.options) {
        for (const opt of dto.options) {
          const createdOpt = await tx.productOption.create({
            data: {
              productId,
              name: opt.name,
              position: opt.position ?? 0,
            },
          });

          if (opt.values) {
            for (const val of opt.values) {
              const createdVal = await tx.productOptionValue.create({
                data: {
                  optionId: createdOpt.id,
                  value: val.value,
                  position: val.position ?? 0,
                },
              });
              if (val.id) {
                tempIdMap[val.id] = createdVal.id;
              }
            }
          }
        }
      }

      // 2. Create Variants
      if (dto.variants) {
        for (const v of dto.variants) {
          const optionValueIds = [
            ...(v.optionValueIds ?? []),
            ...(v.tempOptionValueIds?.map((tid) => tempIdMap[tid]).filter((id): id is string => !!id) ?? []),
          ];

          await tx.productVariant.create({
            data: {
              productId,
              sku: v.sku,
              name: v.name,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              imageUrl: v.imageUrl,
              isDefault: v.isDefault ?? false,
              isActive: v.isActive ?? true,
              optionValues: {
                create: optionValueIds.map((id) => ({ optionValueId: id })),
              },
            },
          });
        }
      }

      const result = await tx.product.findUnique({
        where: { id: productId },
        include: PRODUCT_INCLUDE,
      });

      return result as unknown as ProductWithRelations;
    });

    return this.mapToResponse(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const existing = await this.findOne(id);
    const { options, variants, ...productData } = dto;
    const data: Prisma.ProductUncheckedUpdateInput = { ...productData };

    if (dto.name && dto.name !== existing.name && !dto.slug) {
      data.slug = await this.generateUniqueSlug(dto.name, this.prisma, id);
    }

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data,
      });

      if (options) {
        // Simple strategy: delete existing and recreate
        await tx.productOption.deleteMany({ where: { productId: id } });

        const tempIdMap: Record<string, string> = {};
        for (const opt of options) {
          const createdOpt = await tx.productOption.create({
            data: {
              productId: id,
              name: opt.name,
              position: opt.position ?? 0,
            },
          });

          if (opt.values) {
            for (const val of opt.values) {
              const createdVal = await tx.productOptionValue.create({
                data: {
                  optionId: createdOpt.id,
                  value: val.value,
                  position: val.position ?? 0,
                },
              });
              if (val.id) {
                tempIdMap[val.id] = createdVal.id;
              }
            }
          }
        }

        if (variants) {
          await tx.productVariant.deleteMany({ where: { productId: id } });
          for (const v of variants) {
            const optionValueIds = [
              ...(v.optionValueIds ?? []),
              ...(v.tempOptionValueIds?.map((tid) => tempIdMap[tid]).filter((id): id is string => !!id) ?? []),
            ];

            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                name: v.name,
                price: v.price,
                compareAtPrice: v.compareAtPrice,
                imageUrl: v.imageUrl,
                isDefault: v.isDefault ?? false,
                isActive: v.isActive ?? true,
                optionValues: {
                  create: optionValueIds.map((ovId) => ({ optionValueId: ovId })),
                },
              },
            });
          }
        }
      } else if (variants) {
        // If only variants provided
        await tx.productVariant.deleteMany({ where: { productId: id } });
        for (const v of variants) {
          await tx.productVariant.create({
            data: {
              productId: id,
              sku: v.sku,
              name: v.name,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              imageUrl: v.imageUrl,
              isDefault: v.isDefault ?? false,
              isActive: v.isActive ?? true,
              optionValues: {
                create: v.optionValueIds?.map((ovId) => ({ optionValueId: ovId })) ?? [],
              },
            },
          });
        }
      }

      const result = await tx.product.findUnique({
        where: { id },
        include: PRODUCT_INCLUDE,
      });

      return result as unknown as ProductWithRelations;
    });

    return this.mapToResponse(product);
  }

  private async generateUniqueSlug(
    name: string,
    client: Pick<PrismaService, 'product'>,
    currentId?: string,
  ): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await client.product.findFirst({
        where: {
          slug,
          id: currentId ? { not: currentId } : undefined,
        },
      });

      if (!existing) return slug;
      slug = `${baseSlug}-${counter++}`;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
  }

  private formatCode(prefix: string, seq: number): string {
    return `${prefix}-${String(seq).padStart(6, '0')}`;
  }

  private mapToResponse(product: ProductWithRelations): Product {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      slug: product.slug,
      description: product.description,
      colorId: product.colorId,
      color: product.color
        ? { id: product.color.id, name: product.color.name, hexCode: product.color.hexCode }
        : null,
      badge: product.badge,
      productCategoryId: product.productCategoryId,
      productCategory: {
        id: product.productCategory.id,
        name: product.productCategory.name,
      },
      unitId: product.unitId,
      unit: {
        id: product.unit.id,
        name: product.unit.name,
        abbreviation: product.unit.abbreviation,
      },
      sellingPrice: product.sellingPrice.toNumber(),
      purchasePrice: product.purchasePrice
        ? product.purchasePrice.toNumber()
        : null,
      weightGram: product.weightGram,
      isActive: product.isActive,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
        productId: img.productId,
      })),
      options: product.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        position: opt.position,
        values: opt.values.map((v) => ({
          id: v.id,
          optionId: v.optionId,
          value: v.value,
          position: v.position,
        })),
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price.toNumber(),
        compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toNumber() : null,
        imageUrl: v.imageUrl,
        isDefault: v.isDefault,
        isActive: v.isActive,
        optionValues: v.optionValues.map((ov) => ({
          optionName: ov.optionValue.option.name,
          value: ov.optionValue.value,
        })),
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
