import { Suspense } from "react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { ColorTable } from "@/components/colors/ColorTable";

export default function ColorsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Warna</h1>
        <p className="text-sm text-gray-500 mt-1">Lihat dan kelola warna produk di sistem.</p>
      </div>
      <PermissionGate permission="color:read">
        <Suspense fallback={<div>Memuat...</div>}>
          <ColorTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
