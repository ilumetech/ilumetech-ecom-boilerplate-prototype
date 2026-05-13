import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PaginatedResponse, Product } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import type { CreateProductDto, QueryProductDto, UpdateProductDto } from './dto';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { productCategory: true; unit: true };
}>;

const PRODUCT_INCLUDE = { productCategory: true, unit: true } as const;

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductDto): Promise<PaginatedResponse<Product>> {
    const filters: Record<string, unknown> = {};
    if (query.productCategoryId) filters.productCategoryId = query.productCategoryId;
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
      this.prisma.product.findMany({ skip, take, where, orderBy, include: PRODUCT_INCLUDE }),
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

      return tx.product.create({
        data: {
          code,
          name: dto.name,
          description: dto.description,
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
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: PRODUCT_INCLUDE,
    });

    return this.mapToResponse(product);
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
      description: product.description,
      productCategoryId: product.productCategoryId,
      productCategory: { id: product.productCategory.id, name: product.productCategory.name },
      unitId: product.unitId,
      unit: {
        id: product.unit.id,
        name: product.unit.name,
        abbreviation: product.unit.abbreviation,
      },
      sellingPrice: product.sellingPrice.toNumber(),
      purchasePrice: product.purchasePrice ? product.purchasePrice.toNumber() : null,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
