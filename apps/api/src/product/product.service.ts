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
    variants: {
      include: {
        attributes: {
          include: {
            attribute: true;
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
  variants: {
    include: {
      attributes: {
        include: {
          attribute: true,
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

      return tx.product.create({
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
          isActive: dto.isActive ?? true,
        },
        include: PRODUCT_INCLUDE,
      });
    });

    return this.mapToResponse(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const existing = await this.findOne(id);
    const data: Prisma.ProductUncheckedUpdateInput = { ...dto };

    if (dto.name && dto.name !== existing.name && !dto.slug) {
      data.slug = await this.generateUniqueSlug(dto.name, this.prisma, id);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
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
        ? { id: product.color.id, name: product.color.name }
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
      isActive: product.isActive,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
        productId: img.productId,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: v.price ? v.price.toNumber() : null,
        stock: v.stock,
        productId: v.productId,
        attributes: v.attributes.map((attr) => ({
          id: attr.id,
          value: attr.value,
          meta: attr.meta,
          attributeId: attr.attributeId,
          attribute: {
            id: attr.attribute.id,
            name: attr.attribute.name,
            createdAt: attr.attribute.createdAt.toISOString(),
            updatedAt: attr.attribute.updatedAt.toISOString(),
          },
          createdAt: attr.createdAt.toISOString(),
          updatedAt: attr.updatedAt.toISOString(),
        })),
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
