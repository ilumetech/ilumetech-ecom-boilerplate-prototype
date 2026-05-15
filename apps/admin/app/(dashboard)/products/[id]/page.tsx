import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { ProductDetailView } from "@/components/products/ProductDetailView";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <PermissionGate permission={PERMISSIONS.PRODUCT.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <ProductDetailView productId={id} />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
