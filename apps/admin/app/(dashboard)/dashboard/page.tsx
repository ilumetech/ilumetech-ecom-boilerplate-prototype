import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { PermissionGate } from "@/components/auth/PermissionGate";
import UserStatusChart from "@/components/dashboard/UserStatusChart";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Dashboard</h1>
      </div>
      <PermissionGate permission={PERMISSIONS.DASHBOARD.VIEW_USER_STATS}>
        <Suspense fallback={<div>Memuat...</div>}>
          <UserStatusChart />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
