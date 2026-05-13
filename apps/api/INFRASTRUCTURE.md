# API Infrastructure — How It Works

This document explains the backend foundation built in `apps/api/src/common/`.
Every domain module (product, stock, order, etc.) will build on top of this.

---

## Request Lifecycle

Every HTTP request passes through these layers in order:

```
Incoming Request
      │
      ▼
GlobalExceptionFilter        ← catches any exception thrown below
      │
      ▼
ResponseTransformInterceptor ← wraps the final response in { data }
      │
      ▼
ClerkAuthGuard               ← verifies JWT (if @UseGuards applied)
      │
      ▼
PermissionsGuard             ← checks org permissions (if @UseGuards applied)
      │
      ▼
ValidationPipe               ← validates + transforms DTO inputs
      │
      ▼
Controller → Service → Prisma
```

Errors thrown anywhere (guards, pipes, services) bubble up and are caught by `GlobalExceptionFilter`.

---

## Folder Structure

```
apps/api/
├── prisma/
│   └── schema.prisma              Database schema (add domain models here)
└── src/
    ├── main.ts                    Bootstrap — wires global filter/interceptor/pipe
    ├── app.module.ts              Root module — imports PrismaModule
    ├── app.controller.ts          GET /health (public, no auth)
    └── common/
        ├── types/
        │   └── clerk.types.ts     ClerkUser and AuthenticatedRequest interfaces
        ├── prisma/
        │   ├── prisma.service.ts  Database client (inject this in services)
        │   └── prisma.module.ts   Global module — available everywhere
        ├── guards/
        │   ├── clerk-auth.guard.ts   Verifies Clerk JWT, attaches user to request
        │   ├── permissions.guard.ts  Checks org permissions from JWT
        │   └── index.ts
        ├── decorators/
        │   ├── current-user.decorator.ts  @CurrentUser() param decorator
        │   ├── permissions.decorator.ts   @Permissions() metadata decorator
        │   └── index.ts
        ├── filters/
        │   ├── global-exception.filter.ts  Formats all errors consistently
        │   └── index.ts
        ├── interceptors/
        │   ├── response-transform.interceptor.ts  Wraps responses in { data }
        │   └── index.ts
        └── dto/
            ├── query.dto.ts  Base DTO for list endpoints (search, sort, page, limit)
            └── index.ts
```

---

## 1. Database — Prisma

### `common/prisma/prisma.service.ts`

The database client. Inject it into any service that needs to query the database.

```typescript
// In any domain service:
@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany()
  }
}
```

`PrismaService` extends `PrismaClient` directly, so all Prisma model methods are available via `this.prisma`.

### `common/prisma/prisma.module.ts`

Marked `@Global()` — importing `PrismaModule` once in `AppModule` makes `PrismaService` available in every module without re-importing.

### `prisma/schema.prisma`

Domain models go here. Currently has a `Placeholder` model (required to bootstrap Prisma generate).
**When adding the first domain model:** remove `Placeholder`, add your model, run `prisma migrate dev`.

---

## 2. Authentication — ClerkAuthGuard

### `common/guards/clerk-auth.guard.ts`

Verifies the Clerk JWT from the `Authorization: Bearer <token>` header.
On success, attaches the decoded payload to `request.user`.
On failure (missing/invalid/expired token), throws `401 Unauthorized`.

```typescript
// How it works internally:
// 1. Reads Authorization header
// 2. Calls verifyToken(token, { secretKey }) from @clerk/backend
// 3. Sets request.user = decoded JWT payload
// 4. Throws UnauthorizedException on any failure
```

**Important:** The guard never reads `userId` or `orgId` from the request body.
Identity is always extracted from the verified JWT only.

### Usage on a route:

```typescript
@UseGuards(ClerkAuthGuard)
@Get('me')
getMe(@CurrentUser() user: ClerkUser) {
  return user  // { sub, org_id, org_role, org_permissions, ... }
}
```

---

## 3. Authorization — PermissionsGuard

### `common/guards/permissions.guard.ts`

Checks that the authenticated user has ALL required permissions.
Permissions come from the `org_permissions` array in the JWT payload.
Format: `org:<feature>:<action>` (e.g. `org:product:create`).

```typescript
// If no @Permissions() is set → guard passes (just auth required)
// If @Permissions('org:product:read') → user must have that permission
```

**Always pair with ClerkAuthGuard** — PermissionsGuard reads `request.user` which ClerkAuthGuard sets.

### Usage:

```typescript
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Permissions('org:product:read')
@Get()
findAll(@Query() query: QueryProductDto) {
  return this.productService.findAll(query)
}
```

---

## 4. Decorators

### `@CurrentUser()`

Extracts `request.user` (the verified JWT payload) as a route parameter.
Type is `ClerkUser` — see `common/types/clerk.types.ts` for the full shape.

```typescript
@Get('profile')
@UseGuards(ClerkAuthGuard)
getProfile(@CurrentUser() user: ClerkUser) {
  return { userId: user.sub, orgId: user.org_id }
}
```

### `@Permissions()`

Sets permission metadata that `PermissionsGuard` reads.
Accepts one or more permission strings — user must have ALL of them.

```typescript
@Permissions('org:stock:update', 'org:stock:read')  // requires both
```

---

## 5. Error Handling — GlobalExceptionFilter

### `common/filters/global-exception.filter.ts`

Registered globally in `main.ts`. Catches every exception thrown anywhere in the app.

**Output shape for all errors:**
```json
{
  "error": "BadRequestException",
  "message": "Name is required",
  "statusCode": 400
}
```

For `ValidationPipe` errors, `message` is an array:
```json
{
  "error": "Bad Request",
  "message": ["name must not be empty", "price must be a positive number"],
  "statusCode": 400
}
```

Stack traces are never included in the response.
Unknown/unexpected exceptions always return `500 Internal Server Error`.

---

## 6. Response Shape — ResponseTransformInterceptor

### `common/interceptors/response-transform.interceptor.ts`

Registered globally in `main.ts`. Wraps every controller return value in `{ data }`.

**Single item** — controller returns `product`:
```json
{ "data": { "id": 1, "name": "Widget" } }
```

**List with pagination** — service returns `{ data: products, meta: {...} }` (already has `data` key → not double-wrapped):
```json
{
  "data": [{ "id": 1 }, { "id": 2 }],
  "meta": { "total": 50, "page": 1, "limit": 10 }
}
```

The interceptor detects if the response already has a `data` key and skips wrapping it.
This means **list services must return `{ data, meta }` themselves**.

---

## 7. Query DTO — QueryDto

### `common/dto/query.dto.ts`

Base class for all list endpoint query parameters. Extend it per-module.

| Field       | Type             | Default | Constraints          |
|-------------|------------------|---------|----------------------|
| `search`    | string (optional)| —       | —                    |
| `sortBy`    | string (optional)| —       | —                    |
| `sortOrder` | `'asc'` \| `'desc'` | —  | one of asc/desc      |
| `page`      | number (optional)| `1`     | integer, min 1       |
| `limit`     | number (optional)| `10`    | integer, min 1, max 100 |

```typescript
// Extend for module-specific filters:
export class QueryProductDto extends QueryDto {
  @IsOptional()
  @IsString()
  category?: string
}

// Use in controller:
@Get()
findAll(@Query() query: QueryProductDto) {
  return this.productService.findAll(query)
}
```

`@Type(() => Number)` on `page` and `limit` is required because HTTP query params are always strings — `class-transformer` converts them to numbers before validation runs.

---

## 8. Wiring — main.ts

Three things are registered globally:

```typescript
app.useGlobalFilters(new GlobalExceptionFilter())
// → All errors formatted as { error, message, statusCode }

app.useGlobalInterceptors(new ResponseTransformInterceptor())
// → All responses wrapped as { data } or { data, meta }

app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
// → All DTOs validated; unknown fields stripped; @Type() transforms applied
```

`whitelist: true` strips any properties in a request body that are NOT declared in the DTO.
This prevents clients from injecting unexpected fields.

---

## How to Build a Domain Module

When adding a new module (e.g. `product`), the pattern is:

```
src/product/
  product.module.ts
  product.controller.ts
  product.service.ts
  dto/
    create-product.dto.ts
    update-product.dto.ts
    query-product.dto.ts    (extends QueryDto)
```

1. **Service** — inject `PrismaService`, implement business logic
2. **Controller** — apply `@UseGuards(ClerkAuthGuard, PermissionsGuard)` + `@Permissions(...)` on protected routes
3. **Module** — import into `AppModule`
4. **Schema** — add Prisma model to `prisma/schema.prisma`, run `prisma migrate dev`

The `GlobalExceptionFilter`, `ResponseTransformInterceptor`, and `ValidationPipe` apply automatically — no per-module setup needed.

---

## Environment Variables

| Variable               | Purpose                                 |
|------------------------|-----------------------------------------|
| `DATABASE_URL`         | Neon PostgreSQL connection string       |
| `CLERK_PUBLISHABLE_KEY`| Clerk frontend key (used by web app)    |
| `CLERK_SECRET_KEY`     | Clerk secret key — JWT verification     |
| `PORT`                 | Server port (default: 3001)             |

See `.env.example` for the required format.
