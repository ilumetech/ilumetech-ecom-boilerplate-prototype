# Language Rules

# These rules are mandatory. Apply them to every file you create or modify.

# English is the default language for all code. Indonesian is permitted only in the

# two explicitly listed exceptions below.

## English Required — No Exceptions

Every identifier and path in the codebase must be English:

**Identifiers**

- Variable names, function names, class names, interface names, type aliases, enums, constants
- DTO class names and all DTO property names
- Prisma model names and field names in schema.prisma

**NestJS constructs**

- Module class names: `ProductModule`, not `ProdukModule`
- Service class names: `ProductService`, not `ProdukService`
- Controller class names: `ProductController`, not `ProdukController`
- Guard, decorator, filter, interceptor class names

**API endpoint paths**

- Route strings in `@Get()`, `@Post()`, `@Patch()`, `@Delete()`, `@Controller()`
- `/products` not `/produk`, `/orders` not `/pesanan`, `/stock` not `/stok`

**Files and folders**

- Every file name and folder name across the entire monorepo
- `product.service.ts` not `produk.service.ts`
- `components/products/` not `components/produk/`

**Frontend**

- TanStack Query keys: `['products', 'list']` not `['produk', 'list']`
- API service function names and their file names: `productApi`, `lib/api/product.ts`

**Git**

- Branch names and commit messages

## Indonesian Allowed — Two Exceptions Only

**1. Label values in `lib/labels/[entity].ts`**

Keys must be English (matching the DTO/model property name). Values are Indonesian.

```typescript
// CORRECT
export const PRODUCT_LABELS = {
  name: "Nama Produk",
  sku: "SKU",
  price: "Harga",
  stock: "Stok",
} as const;

// WRONG — Indonesian key
export const PRODUCT_LABELS = {
  nama: "Nama Produk", // key must match the English property name
} as const;
```

**2. User-facing string literals passed directly to display components**

Toast messages, empty state text, confirmation copy — only when passed inline to a display function and not assigned to an identifier.

```typescript
// CORRECT — inline UI string
message.success("Produk berhasil disimpan");

// WRONG — Indonesian assigned to an identifier
const pesanSukses = "Produk berhasil disimpan"; // identifier must be English: successMessage
```

## Wrong vs. Correct Examples

```typescript
// WRONG — Indonesian identifiers
@Controller("produk")
export class ProdukController {}

async function ambilSemuaProduk() {}

const hargaProduk = product.price;

// CORRECT
@Controller("products")
export class ProductController {}

async function findAllProducts() {}

const productPrice = product.price;
```

```
// WRONG — Indonesian file/folder names
apps/api/src/produk/produk.service.ts
apps/admin/components/produk/TabelProduk.tsx

// CORRECT
apps/api/src/product/product.service.ts
apps/admin/components/products/ProductTable.tsx
```

## When Claude Generates Code

- Apply these rules to every identifier, path, and filename generated — no exceptions
- If a Prisma model, NestJS module, or API route contains Indonesian, flag it before finishing
- Never name a file or folder in Indonesian, even for a quick scaffold
- Labels files are the only place Indonesian strings belong — never inline in component JSX as a hardcoded string assigned to a variable
