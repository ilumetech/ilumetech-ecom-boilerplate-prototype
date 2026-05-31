import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { PromoCodeTable } from "@/components/promos/PromoCodeTable";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function PromosPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Manajemen Promo & Diskon</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat dan kelola data kode promo voucher di toko online.
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.PROMO_CODE.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <PromoCodeTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
