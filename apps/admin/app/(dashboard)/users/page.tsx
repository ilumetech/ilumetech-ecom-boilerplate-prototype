import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { UserTable } from "@/components/users/UserTable";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function UsersPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat dan kelola data pengguna di sistem.
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.USER.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <UserTable />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
