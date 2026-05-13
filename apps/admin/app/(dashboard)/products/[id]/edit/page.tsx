import { Suspense } from "react";
import { ProductForm } from "@/components/products/ProductForm";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Edit Produk</h1>
      </div>
      <PermissionGate permission="product:update">
        <Suspense fallback={<div>Memuat...</div>}>
          <ProductForm mode="edit" productId={id} />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
