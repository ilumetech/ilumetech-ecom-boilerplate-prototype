import { Injectable } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';
import type { PaginatedResponse } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import type { QueryAuditLogDto } from './dto';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAuditLogDto): Promise<PaginatedResponse<AuditLog>> {
    const filters: Record<string, unknown> = {};
    if (query.actorId) filters.actorId = query.actorId;
    if (query.entityType) filters.entityType = query.entityType;
    if (query.action) filters.action = query.action;
    if (query.category) filters.category = query.category;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['entityType', 'actorId'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['createdAt', 'entityType', 'action'],
      page: query.page,
      limit: query.limit,
    });

    const resolvedOrderBy = orderBy ?? { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ skip, take, where, orderBy: resolvedOrderBy }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10) };
  }
}
