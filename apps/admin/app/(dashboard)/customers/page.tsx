import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function CustomersPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Manajemen Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat dan kelola data pelanggan yang terdaftar di sistem.
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.CUSTOMER.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <CustomerTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
