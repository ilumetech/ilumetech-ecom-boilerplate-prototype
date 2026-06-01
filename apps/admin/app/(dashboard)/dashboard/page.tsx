import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { PermissionGate } from "@/components/auth/PermissionGate";
import UserStatusChart from "@/components/dashboard/UserStatusChart";
import ProductStatusChart from "@/components/dashboard/ProductStatusChart";
import CategoryStatsChart from "@/components/dashboard/CategoryStatsChart";
import SalesAnalyticsDashboard from "@/components/dashboard/SalesAnalyticsDashboard";

export default function DashboardPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <PermissionGate permission={PERMISSIONS.ORDER.READ}>
            <Suspense fallback={<div>Memuat...</div>}>
              <SalesAnalyticsDashboard />
            </Suspense>
          </PermissionGate>
        </div>

        <PermissionGate permission={PERMISSIONS.DASHBOARD.VIEW_USER_STATS}>
          <Suspense fallback={<div>Memuat...</div>}>
            <UserStatusChart />
          </Suspense>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.DASHBOARD.VIEW_PRODUCT_STATS}>
          <Suspense fallback={<div>Memuat...</div>}>
            <ProductStatusChart />
          </Suspense>
        </PermissionGate>

        <div className="lg:col-span-2">
          <PermissionGate permission={PERMISSIONS.DASHBOARD.VIEW_CATEGORY_STATS}>
            <Suspense fallback={<div>Memuat...</div>}>
              <CategoryStatsChart />
            </Suspense>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}

