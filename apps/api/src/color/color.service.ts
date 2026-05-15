import { Injectable, NotFoundException } from '@nestjs/common';
import type { Color, PaginatedResponse } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import type { ColorQueryDto, CreateColorDto, UpdateColorDto } from './dto';

interface PrismaColor {
  id: string;
  name: string;
  hexCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ColorService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ColorQueryDto): Promise<PaginatedResponse<Color>> {
    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['name'],
      filters: {},
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['name', 'createdAt'],
      page: query.page,
      limit: query.limit,
    });

    const [colors, total] = await Promise.all([
      this.prisma.color.findMany({ skip, take, where, orderBy }),
      this.prisma.color.count({ where }),
    ]);

    return {
      data: colors.map(this.mapToResponse),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async findOne(id: string): Promise<Color> {
    const color = await this.prisma.color.findUnique({ where: { id } });

    if (!color) throw new NotFoundException(`Color ${id} not found`);

    return this.mapToResponse(color);
  }

  async create(dto: CreateColorDto): Promise<Color> {
    const color = await this.prisma.color.create({
      data: { 
        name: dto.name,
        hexCode: dto.hexCode,
      },
    });

    return this.mapToResponse(color);
  }

  async update(id: string, dto: UpdateColorDto): Promise<Color> {
    await this.findOne(id);

    const color = await this.prisma.color.update({
      where: { id },
      data: dto,
    });

    return this.mapToResponse(color);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.color.delete({ where: { id } });
  }

  private mapToResponse(color: PrismaColor): Color {
    return {
      id: color.id,
      name: color.name,
      hexCode: color.hexCode,
      createdAt: color.createdAt.toISOString(),
      updatedAt: color.updatedAt.toISOString(),
    };
  }
}
