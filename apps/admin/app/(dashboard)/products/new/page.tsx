import { Suspense } from "react";
import { ProductForm } from "@/components/products/ProductForm";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function NewProductPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Tambah Produk</h1>
      </div>
      <PermissionGate permission="product:create">
        <Suspense fallback={<div>Memuat...</div>}>
          <ProductForm mode="create" />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
