"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Empty, Spin, theme } from "antd";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { dashboardApi } from "@/lib/api/dashboard";
import type { ProductStats } from "@/lib/api/dashboard";
import { DASHBOARD_LABELS } from "@/lib/labels/dashboard";

function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Spin size="large" />
    </div>
  );
}

function ProductPieChart({
  stats,
  colors,
}: {
  stats: ProductStats;
  colors: string[];
}) {
  const chartData = [
    { name: DASHBOARD_LABELS.activeProducts, value: stats.active },
    { name: DASHBOARD_LABELS.inactiveProducts, value: stats.inactive },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          outerRadius={100}
          label={(props) =>
            `${props.name ?? ""}: ${props.value ?? 0} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
          }
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function ProductStatusChart() {
  const { token } = theme.useToken();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "product-stats"],
    queryFn: dashboardApi.getProductStats,
  });

  const colors = [token.colorSuccess, token.colorError];

  if (isLoading) {
    return (
      <Card title={DASHBOARD_LABELS.productStatsCard}>
        <LoadingState />
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card title={DASHBOARD_LABELS.productStatsCard}>
        <Empty />
      </Card>
    );
  }

  return (
    <Card title={DASHBOARD_LABELS.productStatsCard}>
      <ProductPieChart stats={stats} colors={colors} />
    </Card>
  );
}
