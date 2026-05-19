import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { ProductTable } from "@/components/products/ProductTable";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function ProductsPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Manajemen Produk</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat dan kelola data produk di sistem.
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.PRODUCT.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <ProductTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
