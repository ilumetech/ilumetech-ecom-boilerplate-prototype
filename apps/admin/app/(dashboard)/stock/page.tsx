import { Suspense } from "react";
import { PERMISSIONS } from "@ilumetech/types";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { StockPageView } from "@/components/stock/StockPageView";
import { STOCK_LABELS } from "@/lib/labels/stock";

export default function StockPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">{STOCK_LABELS.pageTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {STOCK_LABELS.pageDescription}
        </p>
      </div>
      <PermissionGate permission={PERMISSIONS.STOCK.READ}>
        <Suspense fallback={<div>Memuat...</div>}>
          <StockPageView />
        </Suspense>
      </PermissionGate>
    </div>
  );
}
