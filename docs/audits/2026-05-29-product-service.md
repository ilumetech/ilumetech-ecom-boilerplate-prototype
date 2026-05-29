# Audit: product.service.ts & product-variant.service.ts

## Context

Audit requested for correctness issues in the product domain services. No code is changed here — this document captures findings and recommended fixes only.

---

## Issue 1 — Hard-deletes bypass `onDelete: Restrict` on StockMovement

### Problem

`StockMovement.productVariantId` is defined with `onDelete: Restrict` in the Prisma schema. That means Postgres will throw a FK constraint violation (P2003) if any `ProductVariant` with associated `StockMovement` rows is hard-deleted.

`ProductService.update()` in `product.service.ts` contains **three separate hard-delete paths** with no guard:

| Location | Trigger | Code |
|---|---|---|
| Line 488–493 | `options` present, variants payload omits some SKUs | `tx.productVariant.deleteMany(...)` |
| Line 497–498 | `options === []` (empty array) — clears all options/variants | `tx.productVariant.deleteMany(...)` |
| Line 568–573 | `options` absent but `variants` present, variants payload omits some SKUs | `tx.productVariant.deleteMany(...)` |

None of these paths check for `StockMovement` records before deleting.

### Risk

Any product that has ever had stock adjusted (purchase, sale, adjustment) will throw a raw Prisma error (P2003) when an admin tries to update its option/variant structure. The transaction rolls back silently but the API returns a 500 unless the global exception filter handles P2003. Either way the update fails with no useful error message.

### Fix

Before each `deleteMany` call, query for stock movement history on the candidate variant IDs:

```ts
const variantIds = variantsToDelete.map((dv) => dv.id);
const movementCount = await tx.stockMovement.count({
  where: { productVariantId: { in: variantIds } },
});
if (movementCount > 0) {
  throw new BadRequestException(
    'Cannot remove variants with stock movement history. Deactivate them instead.',
  );
}
```

Apply this guard at all three delete sites. This converts a surprise P2003 into a clear 400 with an actionable message.

---

## Issue 2 — Inconsistent delete behavior (soft vs hard)

### Problem

Two surfaces delete variants, but they use opposite strategies:

- **`ProductVariantService.remove()`** (`product-variant.service.ts` line 226–232): soft-delete — sets `isActive: false`, preserves the row and its FK to `StockMovement`.
- **`ProductService.update()`** (`product.service.ts` lines 488, 497, 568): hard-delete via `deleteMany` — destroys the row entirely.

### Risk

- Behavioural inconsistency: a variant deleted individually (via `ProductVariantService`) still exists in the DB for audit purposes; a variant removed via a product update is gone permanently.
- Crashes: as described in Issue 1, the hard-delete path crashes on any variant with stock history.
- Developer confusion: the two paths look equivalent from the controller but behave very differently.

### Fix (recommended approach)

**Standardise on soft-delete everywhere.** Replace all three `deleteMany` calls in `ProductService.update()` with:

```ts
await tx.productVariant.updateMany({
  where: { id: { in: variantsToDelete.map((dv) => dv.id) } },
  data: { isActive: false },
});
```

This is consistent with `ProductVariantService.remove()`, preserves FK integrity, and keeps stock history intact.

The empty-options path (line 497–498) that currently hard-deletes all variants should follow the same pattern — soft-delete variants, then delete options (options have no stock history FK, so hard-deleting them is fine).

---

## Issue 3 — `buildVariantPricingData` duplicated across both services

### Problem

`buildVariantPricingData(variant: CreateProductVariantDto)` is **byte-for-byte identical** in both services:

- `product.service.ts` line 633–661
- `product-variant.service.ts` line 234–262

Same validation logic, same return shape, same type signature.

### Risk

A bug fix or rule change (e.g. "finalPrice can equal base price") must be applied in two places. One will inevitably drift.

### Fix

Extract to a shared module-level utility at:

```
apps/api/src/product/product-variant.utils.ts
```

```ts
export function buildVariantPricingData(variant: CreateProductVariantDto) { ... }
```

Both services import and call the shared function. `buildUpdateVariantPricingData` in `ProductVariantService` already delegates to `buildVariantPricingData` — that delegation is preserved unchanged, it just calls the shared import instead of `this.buildVariantPricingData`.

This is product-domain-specific logic, so `common/utils/` is the wrong home. Keep it co-located with the product module.

---

## Issue 4 — Slug auto-updates on name change (decision point)

### Problem

`ProductService.update()` line 340–342:

```ts
if (dto.name && dto.name !== existing.name && !dto.slug) {
  data.slug = await this.generateUniqueSlug(dto.name, this.prisma, id);
}
```

When an admin renames a product, the slug is silently regenerated.

### Risk

- **SEO breakage**: Google-indexed URLs, sitemaps, and external links all use the slug. A rename invalidates every external reference instantly.
- **Storefront 404s**: `findPublicBySlug()` (line 222) looks up by slug directly; any in-flight navigation, cached URL, or shared link will 404.
- **No redirect mechanism**: There is no `ProductSlugHistory` model or redirect layer to handle the old slug.

### Recommended fix (lock slug on creation)

Remove the auto-update block. The slug is set once at creation via `generateUniqueSlug` and never changed automatically thereafter.

Admins who genuinely need to change a slug can pass `dto.slug` explicitly in the PATCH request and accept responsibility for the redirect impact.

This is the simpler option — no new schema, no redirect infrastructure, predictable behaviour. If slug redirect support is needed later it can be added as an explicit feature.

**Alternative (not recommended now):** Keep auto-update but add a `ProductSlugHistory` model for 301 redirects. Higher complexity, requires a schema migration and storefront middleware.

---

## Critical files

- `apps/api/src/product/product.service.ts` — Issues 1, 2, 3 (duplicate), 4
- `apps/api/src/product/product-variant.service.ts` — Issues 2 (soft-delete reference), 3 (duplicate)
- `packages/prisma/schema.prisma` — FK constraint context for Issue 1

## Verification (post-fix)

1. **Issue 1**: Attempt to remove a variant with existing `StockMovement` rows via a product PATCH — expect 400 with clear message, not 500.
2. **Issue 2**: Delete a variant individually (`ProductVariantService.remove`) and via product update — both should result in `isActive: false`, not a missing row.
3. **Issue 3**: Confirm `buildVariantPricingData` exists only in `product-variant.utils.ts`; both services import from there.
4. **Issue 4**: Rename a product without passing `dto.slug` — slug should remain unchanged. Pass `dto.slug` explicitly — slug should update to the provided value.
