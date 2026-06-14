import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Prisma,
  ProductVariant as PrismaProductVariant,
} from '@prisma/client';
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
  CreateProductVariantDto,
} from './dto';
import { buildVariantPricingData } from './product-variant.utils';

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
      where: {
        isActive: true;
      };
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

type ResolvedVariantInput = {
  variant: CreateProductVariantDto;
  optionValueIds: string[];
  existingVariant?: PrismaProductVariant;
};

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
    where: {
      isActive: true,
    },
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

    if (query.color) {
      filters.options = {
        some: {
          name: { equals: 'color', mode: 'insensitive' },
          values: {
            some: {
              value: { equals: query.color, mode: 'insensitive' },
            },
          },
        },
      };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filters.sellingPrice = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

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

    if (query.color) {
      filters.options = {
        some: {
          name: { equals: 'color', mode: 'insensitive' },
          values: {
            some: {
              value: { equals: query.color, mode: 'insensitive' },
            },
          },
        },
      };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filters.sellingPrice = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

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

  async findPublicColors(): Promise<{ data: string[] }> {
    const values = await this.prisma.productOptionValue.findMany({
      where: {
        option: {
          name: { equals: 'color', mode: 'insensitive' },
        },
      },
      select: {
        value: true,
      },
      distinct: ['value'],
    });
    return { data: values.map((v) => v.value) };
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
      const slug = await this.generateUniqueSlug(dto.slug ?? dto.name, tx);

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
        const resolvedVariants = await this.resolveAndValidateVariants(
          tx,
          productId,
          dto.variants,
          tempIdMap,
        );

        for (const { variant: v, optionValueIds } of resolvedVariants) {
          await tx.productVariant.create({
            data: {
              productId,
              sku: v.sku,
              name: v.name,
              ...buildVariantPricingData(v),
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
    await this.findOne(id);
    const { options, variants, images, ...productData } = dto;
    const data: Prisma.ProductUncheckedUpdateInput = { ...productData };

    if (dto.slug !== undefined) {
      data.slug = await this.generateUniqueSlug(dto.slug, this.prisma, id);
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
            const resolvedVariants = await this.resolveAndValidateVariants(
              tx,
              id,
              variants,
              tempIdMap,
              dbVariants,
            );

            for (const {
              variant: v,
              optionValueIds,
              existingVariant,
            } of resolvedVariants) {
              if (existingVariant) {
                await tx.productVariant.update({
                  where: { id: existingVariant.id },
                  data: {
                    name: v.name,
                    ...buildVariantPricingData(v),
                    compareAtPrice: v.compareAtPrice,
                    imageUrl: v.imageUrl,
                    isActive: v.isActive ?? true,
                    optionValues: {
                      deleteMany: {},
                      create: optionValueIds.map((ovId) => ({
                        optionValueId: ovId,
                      })),
                    },
                  },
                });
              } else {
                await tx.productVariant.create({
                  data: {
                    productId: id,
                    sku: v.sku,
                    name: v.name,
                    ...buildVariantPricingData(v),
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
            const incomingVariantIds = new Set(
              resolvedVariants
                .map((v) => v.existingVariant?.id)
                .filter((variantId): variantId is string => !!variantId),
            );
            const variantsToDelete = dbVariants.filter(
              (dv) => !incomingVariantIds.has(dv.id),
            );
            if (variantsToDelete.length > 0) {
              const variantIds = variantsToDelete.map((dv) => dv.id);
              await tx.productVariant.updateMany({
                where: { id: { in: variantIds } },
                data: { isActive: false },
              });
            }
          }
        } else {
          // Explicitly empty options: clean up all options/variants and recreate default single variant
          await tx.productOption.deleteMany({ where: { productId: id } });
          const existingVariants = await tx.productVariant.findMany({
            where: { productId: id },
          });
          const existingVariantIds = existingVariants.map((v) => v.id);
          if (existingVariantIds.length > 0) {
            await tx.productVariant.updateMany({
              where: { productId: id },
              data: { isActive: false },
            });
          }

          if (variants && variants.length > 0) {
            const resolvedVariants = await this.resolveAndValidateVariants(
              tx,
              id,
              variants,
              {},
              existingVariants,
            );

            for (const { variant: v, existingVariant } of resolvedVariants) {
              const baseVariantData = {
                sku: v.sku,
                name: v.name,
                ...buildVariantPricingData(v),
                compareAtPrice: v.compareAtPrice,
                imageUrl: v.imageUrl,
                isActive: v.isActive ?? true,
              };

              if (existingVariant) {
                await tx.productVariant.update({
                  where: { id: existingVariant.id },
                  data: {
                    ...baseVariantData,
                    optionValues: { deleteMany: {} },
                  },
                });
              } else {
                await tx.productVariant.create({
                  data: {
                    productId: id,
                    ...baseVariantData,
                  },
                });
              }
            }
          }
        }
      } else if (variants !== undefined) {
        // If only variants are sent for update, perform a smart upsert on variants only (preserving IDs)
        const dbVariants = await tx.productVariant.findMany({
          where: { productId: id },
        });
        const resolvedVariants = await this.resolveAndValidateVariants(
          tx,
          id,
          variants,
          {},
          dbVariants,
        );

        for (const {
          variant: v,
          optionValueIds,
          existingVariant,
        } of resolvedVariants) {
          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                name: v.name,
                ...buildVariantPricingData(v),
                compareAtPrice: v.compareAtPrice,
                imageUrl: v.imageUrl,
                isActive: v.isActive ?? true,
                optionValues: {
                  deleteMany: {},
                  create: optionValueIds.map((ovId) => ({
                    optionValueId: ovId,
                  })),
                },
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                name: v.name,
                ...buildVariantPricingData(v),
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
        const incomingVariantIds = new Set(
          resolvedVariants
            .map((v) => v.existingVariant?.id)
            .filter((variantId): variantId is string => !!variantId),
        );
        const variantsToDelete = dbVariants.filter(
          (dv) => !incomingVariantIds.has(dv.id),
        );
        if (variantsToDelete.length > 0) {
          const variantIds = variantsToDelete.map((dv) => dv.id);
          await tx.productVariant.updateMany({
            where: { id: { in: variantIds } },
            data: { isActive: false },
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
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async resolveAndValidateVariants(
    tx: Prisma.TransactionClient,
    productId: string,
    variants: CreateProductVariantDto[],
    tempIdMap: Record<string, string> = {},
    dbVariants?: PrismaProductVariant[],
  ): Promise<ResolvedVariantInput[]> {
    const productVariants =
      dbVariants ??
      (await tx.productVariant.findMany({
        where: { productId },
      }));
    const seenSkus = new Set<string>();
    const seenCombos = new Set<string>();

    const resolvedVariants: ResolvedVariantInput[] = [];
    for (const variant of variants) {
      if (seenSkus.has(variant.sku)) {
        throw new BadRequestException(
          `Duplicate SKU ${variant.sku} in variant payload`,
        );
      }
      seenSkus.add(variant.sku);

      const existingVariant = this.findExistingVariant(
        productVariants,
        variant,
      );

      if (variant.id && !existingVariant) {
        throw new BadRequestException(
          `Variant ${variant.id} does not belong to this product`,
        );
      }

      await this.validateSkuIsAvailable(tx, variant, existingVariant);

      const optionValueIds = this.resolveVariantOptionValueIds(
        variant,
        tempIdMap,
      );
      await this.validateOptionValueIds(tx, productId, optionValueIds);

      const comboKey = this.buildOptionCombinationKey(optionValueIds);
      if (seenCombos.has(comboKey)) {
        throw new BadRequestException(
          'A variant with this option combination already exists',
        );
      }
      seenCombos.add(comboKey);

      resolvedVariants.push({ variant, optionValueIds, existingVariant });
    }

    await this.validateCombinationsAreAvailable(
      tx,
      productId,
      resolvedVariants,
    );

    return resolvedVariants;
  }

  private findExistingVariant(
    dbVariants: PrismaProductVariant[],
    variant: CreateProductVariantDto,
  ): PrismaProductVariant | undefined {
    if (variant.id) {
      return dbVariants.find((dbVariant) => dbVariant.id === variant.id);
    }

    return dbVariants.find((dbVariant) => dbVariant.sku === variant.sku);
  }

  private async validateSkuIsAvailable(
    tx: Prisma.TransactionClient,
    variant: CreateProductVariantDto,
    existingVariant?: PrismaProductVariant,
  ): Promise<void> {
    const skuOwner = await tx.productVariant.findUnique({
      where: { sku: variant.sku },
      select: { id: true },
    });

    if (skuOwner && skuOwner.id !== existingVariant?.id) {
      throw new BadRequestException(`SKU ${variant.sku} is already in use`);
    }
  }

  private resolveVariantOptionValueIds(
    variant: CreateProductVariantDto,
    tempIdMap: Record<string, string>,
  ): string[] {
    return [
      ...(variant.optionValueIds ?? []),
      ...(variant.tempOptionValueIds
        ?.map((tempId) => tempIdMap[tempId])
        .filter((id): id is string => !!id) ?? []),
    ];
  }

  private async validateOptionValueIds(
    tx: Prisma.TransactionClient,
    productId: string,
    optionValueIds: string[],
  ): Promise<void> {
    if (optionValueIds.length === 0) return;

    const optionValues = await tx.productOptionValue.findMany({
      where: {
        id: { in: optionValueIds },
        option: { productId },
      },
      select: { optionId: true },
    });

    if (optionValues.length !== optionValueIds.length) {
      throw new BadRequestException(
        'One or more option values do not belong to this product',
      );
    }

    const optionIds = optionValues.map((optionValue) => optionValue.optionId);
    if (new Set(optionIds).size !== optionIds.length) {
      throw new BadRequestException(
        'Each variant must have at most one value per option',
      );
    }
  }

  private async validateCombinationsAreAvailable(
    tx: Prisma.TransactionClient,
    productId: string,
    resolvedVariants: ResolvedVariantInput[],
  ): Promise<void> {
    const existingVariantIds = resolvedVariants
      .map((resolvedVariant) => resolvedVariant.existingVariant?.id)
      .filter((variantId): variantId is string => !!variantId);
    const incomingComboKeys = new Set(
      resolvedVariants.map((resolvedVariant) =>
        this.buildOptionCombinationKey(resolvedVariant.optionValueIds),
      ),
    );

    const conflictingVariants = await tx.productVariant.findMany({
      where: {
        productId,
        isActive: true,
        ...(existingVariantIds.length > 0 && {
          id: { notIn: existingVariantIds },
        }),
      },
      include: { optionValues: true },
    });

    for (const variant of conflictingVariants) {
      const comboKey = this.buildOptionCombinationKey(
        variant.optionValues.map((optionValue) => optionValue.optionValueId),
      );

      if (incomingComboKeys.has(comboKey)) {
        throw new BadRequestException(
          'A variant with this option combination already exists',
        );
      }
    }
  }

  private buildOptionCombinationKey(optionValueIds: string[]): string {
    return [...optionValueIds].sort().join('|');
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
        stockOnHand: v.stockOnHand,
        optionValues: v.optionValues.map((ov) => ({
          optionName: ov.optionValue.option.name,
          value: ov.optionValue.value,
        })),
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  public mapToPublicResponse(product: ProductWithRelations): PublicProduct {
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
