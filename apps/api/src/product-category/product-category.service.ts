import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import type { PaginatedResponse, ProductCategory } from '@ilumetech/types';
import type { CreateProductCategoryDto, ProductCategoryQueryDto, UpdateProductCategoryDto } from './dto';

interface PrismaProductCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductCategoryQueryDto): Promise<PaginatedResponse<ProductCategory>> {
    const filters = query.isActive !== undefined ? { isActive: query.isActive } : {};

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['name', 'description'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['name', 'isActive', 'createdAt'],
      page: query.page,
      limit: query.limit,
    });

    const [categories, total] = await Promise.all([
      this.prisma.productCategory.findMany({ skip, take, where, orderBy }),
      this.prisma.productCategory.count({ where }),
    ]);

    return {
      data: categories.map(this.mapToResponse),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.prisma.productCategory.findUnique({ where: { id } });

    if (!category) throw new NotFoundException(`ProductCategory ${id} not found`);

    return this.mapToResponse(category);
  }

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.prisma.productCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapToResponse(category);
  }

  async update(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
    await this.findOne(id);

    const category = await this.prisma.productCategory.update({
      where: { id },
      data: dto,
    });

    return this.mapToResponse(category);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.productCategory.delete({ where: { id } });
  }

  private mapToResponse(category: PrismaProductCategory): ProductCategory {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
