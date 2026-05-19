import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { ProductCategoryTable } from "@/components/product-categories/ProductCategoryTable";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function ProductCategoriesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Kategori Produk</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat dan kelola kategori produk di sistem.
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.PRODUCT_CATEGORY.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <ProductCategoryTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
