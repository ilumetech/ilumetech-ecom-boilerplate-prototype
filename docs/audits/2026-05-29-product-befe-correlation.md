# Audit: Product Form ↔ Backend DTO Correlation

**Date:** 2026-05-29  
**Scope:** `apps/admin/components/products/ProductForm.tsx` ↔ `apps/api/src/product/dto/`  
**Type:** Read-only audit — no fixes applied

---

## Summary

| Risk | Count |
|------|-------|
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 5 |
| Clean (no issue) | 17 fields |

---

## HIGH RISK

### H1 — Edit form sends full payload instead of dirty fields

- **Field:** All product and variant fields
- **Wrong side:** Frontend (`ProductForm.tsx:1062–1067`)
- **Details:** `handleFinish` builds a complete product payload and calls `updateMutation.mutate(payload)` for both create and edit paths. `getDirtyFields` is imported (line 51) and used in `isFormDirty()` (line 679) for the unsaved-changes guard only — it is never applied to filter the update payload. The admin `CLAUDE.md` rule explicitly mandates: _"Edit form submit must send dirty fields only (partial PATCH)."_
- **Risk:** On every edit save the full product object — including all nested options and variants arrays — overwrites backend state. If another session, webhook, or background process modified any field between page load and form submit, those changes are silently clobbered. Sending the full variants array unconditionally also risks unintended variant mutations when only a simple field like `name` changed.

---

### H2 — `productCategoryId` race condition when creating a new category

- **Field:** `productCategoryId`
- **Wrong side:** Frontend (`ProductForm.tsx:1342–1348`, `905–914`)
- **Details:** When the user selects a `CREATE_…` option from the category dropdown, `onSelect` immediately fires `createCategoryMutation.mutate(name)`. Ant Design's Select component sets the form field value to `"CREATE_CategoryName"` at this point. The `onSuccess` handler at line 910 calls `form.setFieldValue("productCategoryId", response.data.id)` — but this only runs after the API round-trip completes. If the user clicks Submit before the category creation resolves, the payload carries `productCategoryId: "CREATE_Summer"` (a non-CUID string).
- **Risk:** The backend `@IsString()` decorator accepts any string, so `class-validator` passes. Prisma then fails with a foreign key / record-not-found error. No loading state blocks the submit button during category creation. Affects both the create and edit product paths.

---

## MEDIUM RISK

### M1 — Discount enum types duplicated as local aliases

- **Fields:** `discountType`, `discountMode` (on variants)
- **Wrong side:** Frontend (`ProductForm.tsx:114–115`)
- **Details:** The form defines `type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT"` and `type DiscountMode = "AUTOMATIC" | "MANUAL"` as local string-literal type aliases. The backend imports `DiscountType` / `DiscountMode` from `@prisma/client`. Values currently match the Prisma enums exactly, so no runtime error exists today.
- **Risk:** If the Prisma schema adds or renames an enum member, the frontend types won't be updated automatically. Because these are local aliases rather than an import from `packages/types`, TypeScript won't detect the mismatch at compile time.

---

### M2 — `compareAtPrice` exists in DTO and form interface but has no UI input

- **Field:** `compareAtPrice` (variant)
- **Wrong side:** Frontend (no input rendered in the variant table)
- **Details:** `CreateProductVariantDto.compareAtPrice?: number` is a properly decorated optional field. `FormVariant.compareAtPrice?: number` exists in the interface. Edit mode loads it (`v.compareAtPrice ?? undefined`, line 564) and the submit handler sends it back (`compareAtPrice: v.compareAtPrice`, line 1045). However, the variant table renders no editable input for this field.
- **Risk:** New products and variants can never have `compareAtPrice` set from the admin UI. Existing data round-trips safely (load → re-send unchanged), so no data loss. The feature is effectively unreachable from the frontend.

---

## LOW RISK

### L1 — `badge` has no backend enum constraint

- **Field:** `badge` (product level)
- **Wrong side:** Backend (`create-product.dto.ts`, `update-product.dto.ts`)
- **Details:** Frontend dropdown offers exactly `"New Arrival"` and `"Bestseller"` (hardcoded, lines 1370–1371). Backend accepts any string via `@IsString()`. Prisma schema uses `badge String?`. No `@IsIn([...])` or `@IsEnum(...)` constraint is enforced at the DTO level.
- **Risk:** Direct API calls can set arbitrary badge strings, bypassing the dropdown constraint. Low severity — badge is a display label with no downstream business logic. But the UI contract is invisible to the backend.

---

### L2 — Product-level price fields missing `@Min(0)` on backend

- **Fields:** `sellingPrice`, `purchasePrice`, `weightGram` (product level)
- **Wrong side:** Backend (`create-product.dto.ts`, `update-product.dto.ts`)
- **Details:** Variant DTO correctly applies `@Min(0)` to `price`, `finalPrice`, and `compareAtPrice`. Product-level fields have no equivalent constraint. Frontend enforces `min: 0` via Ant Design `InputNumber` props, but this is a UI-only guard.
- **Risk:** Direct API calls can submit negative `sellingPrice` or `purchasePrice`. Prisma does not enforce non-negative on these columns; the service layer would store the values without error.

---

### L3 — `options[].values` optional in DTO, required in form

- **Field:** `options[].values` (nested in `CreateProductOptionDto`)
- **Wrong side:** Backend (`product-option.dto.ts`)
- **Details:** `values` on `CreateProductOptionDto` carries `@IsOptional()`. The frontend blocks submission until every option has at least one value (`allOptionsHaveValues` guard, line 736). The DTO allows an option with zero values to pass `class-validator`.
- **Risk:** Direct API calls can create options without values. The frontend's variant generation code silently skips options with no values (`allOptionsHaveValues` check), leaving the data model in an inconsistent state invisible to the admin UI.

---

### L4 — `UpdateProductOptionDto` is dead code

- **Field:** N/A
- **Wrong side:** Backend (`product-option.dto.ts`)
- **Details:** `UpdateProductOptionDto` (fields: `name?`, `position?`) is defined but never referenced. `UpdateProductDto` uses `CreateProductOptionDto` (which includes `values`) for its `options` array. `UpdateProductOptionDto` has no import or usage anywhere in the codebase.
- **Risk:** No functional impact. Creates developer confusion — future work might attempt to use it thinking it is the correct DTO for patching options inline, rather than using the full `CreateProductOptionDto`.

---

### L5 — `isActive` optional in product DTO, no service-level default verified

- **Field:** `isActive` (product level)
- **Wrong side:** Backend (`create-product.dto.ts`)
- **Details:** Decorated as `@IsOptional() @IsBoolean() isActive?: boolean`. The frontend always sends `isActive` (defaults to `true`). If a direct API call omits it, the service layer must supply a default — this was not verified in this audit.
- **Risk:** Direct API product creation without `isActive` may produce unexpected behaviour depending on service implementation. Low risk in practice since the form always sends the field.

---

## No Issues Found

| Field | Verdict |
|---|---|
| `name`, `slug`, `description` | Match exactly on both sides |
| `unitId` | Match |
| `purchasePrice`, `weightGram` | Both optional number on both sides |
| `images[]` — `url`, `alt`, `sortOrder` | Frontend type and `CreateProductImageDto` are identical |
| `options[].name`, `options[].position` | Match |
| `options[].values[].value`, `.position`, `.id` | Match — frontend correctly maps `label→value` and `value→id` |
| `variants[].sku`, `.name`, `.price`, `.finalPrice` | Match |
| `variants[].discountType` / `discountMode` values | `"PERCENTAGE"`, `"FIXED_AMOUNT"`, `"AUTOMATIC"`, `"MANUAL"` match Prisma enums exactly |
| `variants[].isActive` | Frontend always sends; DTO optional — no issue |
| `variants[].optionValueIds`, `.tempOptionValueIds` | Match on both sides |
| `variants[].imageUrl` | Synced correctly — `variantImages` state is in the `useEffect` dependency array (line 881); form variant values update when a new color image is uploaded |
| `hasVariants`, `priceScheme` | Correctly frontend-only; excluded from all payloads |
| Default variant logic | Correctly sent only when `!hasVariantOptions` (line 1059); not appended alongside real variants |
| Category create-and-select happy path | `onSuccess` at line 910 calls `form.setFieldValue("productCategoryId", response.data.id)`, resolving the `CREATE_…` value correctly when timing is normal |
| Rupiah number parsing | Frontend removes `.` separators before submitting; backend `@Type(() => Number)` handles any residual string conversion — no mismatch |
| `isActive` product default | Frontend sends `true` by default; no gap in the happy path |
