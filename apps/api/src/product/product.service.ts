import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  CreateProductVariantDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto';

type PublicProduct = Omit<Product, 'purchasePrice'>;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    productCategory: true;
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
  unit: true,
  images: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductDto): Promise<PaginatedResponse<Product>> {
    const filters: Record<string, unknown> = {};
    if (query.productCategoryId)
      filters.productCategoryId = query.productCategoryId;
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

  async findPublicAll(
    query: QueryProductDto,
  ): Promise<PaginatedResponse<PublicProduct>> {
    const filters: Record<string, unknown> = { isActive: true };
    if (query.productCategoryId)
      filters.productCategoryId = query.productCategoryId;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['name', 'code'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['name', 'code', 'sellingPrice', 'createdAt'],
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
      data: products.map((p) => this.mapToPublicResponse(p)),
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

  async findPublicBySlug(slug: string): Promise<PublicProduct> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: PRODUCT_INCLUDE,
    });

    if (!product) throw new NotFoundException(`Product ${slug} not found`);

    return this.mapToPublicResponse(product);
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
          badge: dto.badge,
          productCategoryId: dto.productCategoryId,
          unitId: dto.unitId,
          sellingPrice: dto.sellingPrice,
          purchasePrice: dto.purchasePrice,
          weightGram: dto.weightGram,
          isActive: dto.isActive ?? true,
          images: {
            create: dto.images?.map((img) => ({
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder ?? 0,
            })),
          },
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
            ...(v.tempOptionValueIds
              ?.map((tid) => tempIdMap[tid])
              .filter((id): id is string => !!id) ?? []),
          ];

          await tx.productVariant.create({
            data: {
              productId,
              sku: v.sku,
              name: v.name,
              ...this.buildVariantPricingData(v),
              compareAtPrice: v.compareAtPrice,
              imageUrl: v.imageUrl,
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
    const { options, variants, images, ...productData } = dto;
    const data: Prisma.ProductUncheckedUpdateInput = { ...productData };

    if (dto.name && dto.name !== existing.name && !dto.slug) {
      data.slug = await this.generateUniqueSlug(dto.name, this.prisma, id);
    }

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data,
      });

      if (options !== undefined) {
        if (options.length > 0) {
          const tempIdMap: Record<string, string> = {};

          // 1. Upsert Options and OptionValues non-destructively
          for (const opt of options) {
            let existingOpt = await tx.productOption.findUnique({
              where: {
                productId_name: {
                  productId: id,
                  name: opt.name,
                },
              },
            });

            if (!existingOpt) {
              existingOpt = await tx.productOption.create({
                data: {
                  productId: id,
                  name: opt.name,
                  position: opt.position ?? 0,
                },
              });
            } else {
              await tx.productOption.update({
                where: { id: existingOpt.id },
                data: { position: opt.position ?? 0 },
              });
            }

            if (opt.values) {
              for (const val of opt.values) {
                let existingVal = await tx.productOptionValue.findUnique({
                  where: {
                    optionId_value: {
                      optionId: existingOpt.id,
                      value: val.value,
                    },
                  },
                });

                if (!existingVal) {
                  existingVal = await tx.productOptionValue.create({
                    data: {
                      optionId: existingOpt.id,
                      value: val.value,
                      position: val.position ?? 0,
                    },
                  });
                } else {
                  await tx.productOptionValue.update({
                    where: { id: existingVal.id },
                    data: { position: val.position ?? 0 },
                  });
                }

                if (val.id) {
                  tempIdMap[val.id] = existingVal.id;
                }
              }
            }
          }

          // Delete options that are no longer in the incoming payload (defensive)
          const incomingOptionNames = new Set(options.map((opt) => opt.name));
          const dbOptions = await tx.productOption.findMany({
            where: { productId: id },
          });
          const optionsToDelete = dbOptions.filter(
            (opt) => !incomingOptionNames.has(opt.name),
          );
          if (optionsToDelete.length > 0) {
            await tx.productOption.deleteMany({
              where: {
                id: { in: optionsToDelete.map((opt) => opt.id) },
              },
            });
          }

          // 2. Upsert Variants non-destructively
          if (variants) {
            const dbVariants = await tx.productVariant.findMany({
              where: { productId: id },
            });

            for (const v of variants) {
              const optionValueIds = [
                ...(v.optionValueIds ?? []),
                ...(v.tempOptionValueIds
                  ?.map((tid) => tempIdMap[tid])
                  .filter((id): id is string => !!id) ?? []),
              ];

              const existingVariant = dbVariants.find((dv) => dv.sku === v.sku);

              if (existingVariant) {
                await tx.productVariant.update({
                  where: { id: existingVariant.id },
                  data: {
                    name: v.name,
                    ...this.buildVariantPricingData(v),
                    compareAtPrice: v.compareAtPrice,
                    imageUrl: v.imageUrl,
                    isActive: v.isActive ?? true,
                  },
                });
              } else {
                await tx.productVariant.create({
                  data: {
                    productId: id,
                    sku: v.sku,
                    name: v.name,
                    ...this.buildVariantPricingData(v),
                    compareAtPrice: v.compareAtPrice,
                    imageUrl: v.imageUrl,
                    isActive: v.isActive ?? true,
                    optionValues: {
                      create: optionValueIds.map((ovId) => ({
                        optionValueId: ovId,
                      })),
                    },
                  },
                });
              }
            }

            // Delete variants that are no longer in the incoming payload
            const incomingSkus = new Set(variants.map((v) => v.sku));
            const variantsToDelete = dbVariants.filter(
              (dv) => !incomingSkus.has(dv.sku),
            );
            if (variantsToDelete.length > 0) {
              await tx.productVariant.deleteMany({
                where: {
                  id: { in: variantsToDelete.map((dv) => dv.id) },
                },
              });
            }
          }
        } else {
          // Explicitly empty options: clean up all options/variants and recreate default single variant
          await tx.productOption.deleteMany({ where: { productId: id } });
          await tx.productVariant.deleteMany({ where: { productId: id } });

          if (variants && variants.length > 0) {
            for (const v of variants) {
              await tx.productVariant.create({
                data: {
                  productId: id,
                  sku: v.sku,
                  name: v.name,
                  ...this.buildVariantPricingData(v),
                  compareAtPrice: v.compareAtPrice,
                  imageUrl: v.imageUrl,
                  isActive: v.isActive ?? true,
                },
              });
            }
          }
        }
      } else if (variants !== undefined) {
        // If only variants are sent for update, perform a smart upsert on variants only (preserving IDs)
        const dbVariants = await tx.productVariant.findMany({
          where: { productId: id },
        });

        for (const v of variants) {
          const existingVariant = dbVariants.find((dv) => dv.sku === v.sku);

          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                name: v.name,
                ...this.buildVariantPricingData(v),
                compareAtPrice: v.compareAtPrice,
                imageUrl: v.imageUrl,
                isActive: v.isActive ?? true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                name: v.name,
                ...this.buildVariantPricingData(v),
                compareAtPrice: v.compareAtPrice,
                imageUrl: v.imageUrl,
                isActive: v.isActive ?? true,
                optionValues: {
                  create:
                    v.optionValueIds?.map((ovId) => ({
                      optionValueId: ovId,
                    })) ?? [],
                },
              },
            });
          }
        }

        // Delete variants that are no longer in the incoming payload
        const incomingSkus = new Set(variants.map((v) => v.sku));
        const variantsToDelete = dbVariants.filter(
          (dv) => !incomingSkus.has(dv.sku),
        );
        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: {
              id: { in: variantsToDelete.map((dv) => dv.id) },
            },
          });
        }
      }

      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        for (const img of images) {
          await tx.productImage.create({
            data: {
              productId: id,
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder ?? 0,
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

  private buildVariantPricingData(variant: CreateProductVariantDto) {
    const finalPrice = variant.finalPrice ?? variant.price;

    if (finalPrice > variant.price) {
      throw new BadRequestException(
        'Final price cannot be greater than base price',
      );
    }

    if (variant.discountMode === 'AUTOMATIC' && !variant.discountType) {
      throw new BadRequestException(
        'Automatic discounts require a discount type',
      );
    }

    if (variant.discountType && variant.discountValue == null) {
      throw new BadRequestException(
        'Discount value is required when discount type is provided',
      );
    }

    return {
      price: variant.price,
      finalPrice,
      discountType: variant.discountType,
      discountValue: variant.discountValue,
      discountMode: variant.discountMode,
    };
  }

  private mapToResponse(product: ProductWithRelations): Product {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      slug: product.slug,
      description: product.description,
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
        finalPrice: v.finalPrice.toNumber(),
        compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toNumber() : null,
        discountType: v.discountType,
        discountValue: v.discountValue ? v.discountValue.toNumber() : null,
        discountMode: v.discountMode,
        imageUrl: v.imageUrl,
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

  private mapToPublicResponse(product: ProductWithRelations): PublicProduct {
    const productResponse = this.mapToResponse(product);

    return {
      id: productResponse.id,
      code: productResponse.code,
      name: productResponse.name,
      slug: productResponse.slug,
      description: productResponse.description,
      badge: productResponse.badge,
      productCategoryId: productResponse.productCategoryId,
      productCategory: productResponse.productCategory,
      unitId: productResponse.unitId,
      unit: productResponse.unit,
      sellingPrice: productResponse.sellingPrice,
      weightGram: productResponse.weightGram,
      isActive: productResponse.isActive,
      images: productResponse.images,
      options: productResponse.options,
      variants: productResponse.variants,
      createdAt: productResponse.createdAt,
      updatedAt: productResponse.updatedAt,
    };
  }
}
