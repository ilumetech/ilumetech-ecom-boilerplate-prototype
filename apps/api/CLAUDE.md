# apps/api — NestJS Backend

# Inherits all rules from root CLAUDE.md.

# Rules here are specific to the NestJS backend app.

## Stack

- NestJS with Fastify adapter — never switch to Express
- TypeScript only
- Prisma ORM — no raw SQL ever
- Clerk for authentication only — JWT verification via @clerk/backend
- RBAC is handled via Prisma — roles and permissions are stored in DB, not Clerk
- class-validator + class-transformer for all DTOs
- deployed on Vercel (temporary) or Railway

## Folder Structure

apps/api/
src/
main.ts Fastify bootstrap
app.module.ts Root module
common/
guards/ ClerkAuthGuard, PermissionsGuard
decorators/ @CurrentUser(), @Permissions()
filters/ Global exception filter
interceptors/ Response transform interceptor
dto/ Shared DTOs (QueryDto)
utils/ Shared utilities (buildPrismaQuery)
[module]/ One folder per domain (product, stock, order, etc.)
[module].module.ts
[module].controller.ts
[module].service.ts
dto/
create-[module].dto.ts
update-[module].dto.ts
query-[module].dto.ts

## Module Rules

- One NestJS module per domain — never put two domains in one module
- Controller handles HTTP only — no business logic in controllers
- Service handles all business logic and Prisma calls
- Never call Prisma directly from a controller
- Never import one domain's service directly into another — use events or shared services

## Auth Rules

- Every protected route must have ClerkAuthGuard — no exceptions
- Every route with permission requirements must have PermissionsGuard
- JWT is verified manually via @clerk/backend (not passport) due to Fastify adapter
- Never trust userId from request body — always extract from verified JWT
- No org_id — each deployment is one client, one Clerk app, no organizations
- Permission string format: <feature>:<action> (e.g. product:create, stock:read)
- Permissions are stored in Prisma — PermissionsGuard queries DB, not Clerk JWT

## Guard Pattern

@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Permissions('product:read')
@Get()
findAll(@Query() query: QueryProductDto) {
return this.productService.findAll(query)
}

@Get('me')
@UseGuards(ClerkAuthGuard)
getMe(@CurrentUser() user: ClerkUser) {
return user
}

## DTO Rules

- Every controller input must use a DTO with class-validator decorators
- Use @IsOptional() for all query params
- Use @Type(() => Number) for numeric query params
- Never use plain object types or any for request body
- Shared QueryDto lives in common/dto/ — extend it per module if needed

## Standard QueryDto Pattern

export class QueryDto {
@IsOptional() @IsString()
search?: string

@IsOptional() @IsString()
sortField?: string

@IsOptional() @IsIn(['asc', 'desc'])
sortOrder?: 'asc' | 'desc'

@IsOptional() @Type(() => Number) @IsInt() @Min(1)
page?: number = 1

@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
limit?: number = 10
}

// Extend per module to add filter params:
export class FooQueryDto extends QueryDto {
@IsOptional() @IsString()
status?: string
}

## Standard API Response Shape

// List endpoints — meta wrapper with totalPages
{ data: T[], meta: { total: number, page: number, limit: number, totalPages: number } }

// Single item endpoints
{ data: T }

// Error responses
{ error: string, message: string, statusCode: number }

## Prisma Rules

- Import PrismaService via dependency injection — never instantiate directly
- Always use prisma.$transaction(async (tx) => { ... }) for operations that touch multiple tables — pass tx into all nested calls, never use this.prisma inside a transaction block
- Never use prisma.$transaction for single-table operations — unnecessary overhead
- External API calls (e.g. Clerk) cannot be wrapped in a Prisma transaction — call them before or after the transaction block, never inside
- Never expose Prisma model types directly to the API response — map to DTOs
- Use select/include explicitly — never return full models with sensitive fields
- Pagination: always use skip/take with a separate count query

## Standard Service Pattern (Prisma modules)

// Import buildPrismaQuery from common/utils
async findAll(query: FooQueryDto) {
const filters = { ...(query.status && { status: query.status }) }

const { skip, take, where, orderBy } = buildPrismaQuery({
search: query.search,
searchFields: ['name', 'sku'],
filters,
sortField: query.sortField,
sortOrder: query.sortOrder,
allowedSortFields: ['name', 'createdAt'],
page: query.page,
limit: query.limit,
})

const [data, total] = await Promise.all([
this.prisma.foo.findMany({ skip, take, where, orderBy }),
this.prisma.foo.count({ where }),
])

return { data, meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10) }
}

## Error Handling

- Use NestJS built-in exceptions: NotFoundException, BadRequestException, ForbiddenException
- Never throw raw Error objects from services
- Global exception filter in common/filters/ handles formatting
- Log errors server-side — never expose stack traces to the client
- Custom HttpException messages always take priority over generic mappings in the global exception filter.
- Never override a custom message with a generic one.

## What Claude should always ask before doing

- Adding a new npm dependency
- Creating a new module
- Changing ClerkAuthGuard or PermissionsGuard logic
- Changing the standard API response shape
- Adding raw SQL or bypassing Prisma
- Changing main.ts bootstrap configuration
