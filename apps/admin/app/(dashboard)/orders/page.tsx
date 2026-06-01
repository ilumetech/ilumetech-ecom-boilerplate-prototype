import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { OrderTable } from "@/components/orders/OrderTable";

export default function OrdersPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Manajemen Pesanan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat pesanan masuk, detail pembelian, dan proses status pesanan.
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.ORDER.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <OrderTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
