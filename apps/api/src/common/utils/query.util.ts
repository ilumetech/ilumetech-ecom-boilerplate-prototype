import type { PaginationMeta } from '@ilumetech/types';

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

export interface BuildQueryOptions {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, unknown>;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  allowedSortFields?: string[];
  page?: number;
  limit?: number;
}

export interface PrismaQuery {
  skip: number;
  take: number;
  where: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export function buildPrismaQuery(options: BuildQueryOptions): PrismaQuery {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;
  const where = buildWhereClause(
    options.search,
    options.searchFields ?? [],
    options.filters ?? {},
  );
  const orderBy = buildOrderBy(
    options.sortField,
    options.sortOrder ?? 'asc',
    options.allowedSortFields ?? [],
  );

  return { skip, take: limit, where, ...(orderBy && { orderBy }) };
}

function buildWhereClause(
  search: string | undefined,
  searchFields: string[],
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  addSearchCondition(conditions, search, searchFields);
  addFilterConditions(conditions, filters);

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

function addSearchCondition(
  conditions: Record<string, unknown>[],
  search: string | undefined,
  searchFields: string[],
): void {
  if (!search || searchFields.length === 0) return;

  const searchConditions = searchFields.map((field) => ({
    [field]: { contains: search, mode: 'insensitive' },
  }));
  conditions.push({ OR: searchConditions });
}

function addFilterConditions(
  conditions: Record<string, unknown>[],
  filters: Record<string, unknown>,
): void {
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );

  for (const [field, value] of activeFilters) {
    conditions.push({ [field]: value });
  }
}

function buildOrderBy(
  sortField: string | undefined,
  sortOrder: 'asc' | 'desc',
  allowedSortFields: string[],
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sortField) return undefined;

  const isAllowed =
    allowedSortFields.length === 0 || allowedSortFields.includes(sortField);
  if (!isAllowed) return undefined;

  return { [sortField]: sortOrder };
}
