"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Empty, Spin } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi } from "@/lib/api/dashboard";
import { DASHBOARD_LABELS } from "@/lib/labels/dashboard";

function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Spin size="large" />
    </div>
  );
}

const COLORS = [
  "#1677ff", // blue
  "#52c41a", // green
  "#722ed1", // purple
  "#13c2c2", // cyan
  "#fa8c16", // orange
  "#eb2f96", // magenta
  "#fadb14", // yellow
  "#fa541c", // sunset
];

export default function CategoryStatsChart() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "category-stats"],
    queryFn: dashboardApi.getCategoryStats,
  });

  if (isLoading) {
    return (
      <Card title={DASHBOARD_LABELS.categoryStatsCard}>
        <LoadingState />
      </Card>
    );
  }

  if (!stats || stats.length === 0 || stats.every((item) => item.value === 0)) {
    return (
      <Card title={DASHBOARD_LABELS.categoryStatsCard}>
        <Empty description="Tidak ada data produk" />
      </Card>
    );
  }

  return (
    <Card title={DASHBOARD_LABELS.categoryStatsCard}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={stats}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value) => [`${value} Produk`, "Jumlah"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={45}>
            {stats.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
