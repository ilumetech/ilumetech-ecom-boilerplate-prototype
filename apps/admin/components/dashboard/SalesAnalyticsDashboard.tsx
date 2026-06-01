"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Spin, Empty, Table, Typography, List, Statistic } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  PercentageOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { dashboardApi } from "@/lib/api/dashboard";
import { DASHBOARD_LABELS } from "@/lib/labels/dashboard";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
};

export default function SalesAnalyticsDashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "sales-stats"],
    queryFn: dashboardApi.getSalesStats,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" description="Memuat data analisis penjualan..." />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Card className="my-6">
        <Empty description="Gagal memuat data statistik penjualan." />
      </Card>
    );
  }

  const COLORS = ["#1677ff", "#52c41a", "#722ed1", "#13c2c2", "#fa8c16"];

  return (
    <div className="space-y-6 my-6">
      {/* KPI Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm border border-gray-100 hover:shadow-md transition">
            <Statistic
              title={DASHBOARD_LABELS.totalRevenue}
              value={stats.totalRevenue}
              formatter={(value) => formatPrice(Number(value))}
              prefix={<DollarOutlined className="text-emerald-500 mr-2 bg-emerald-50 p-2 rounded-full" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm border border-gray-100 hover:shadow-md transition">
            <Statistic
              title={DASHBOARD_LABELS.totalOrders}
              value={stats.totalOrders}
              styles={{ content: { fontWeight: "bold" } }}
              prefix={<ShoppingCartOutlined className="text-blue-500 mr-2 bg-blue-50 p-2 rounded-full" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm border border-gray-100 hover:shadow-md transition">
            <Statistic
              title={DASHBOARD_LABELS.averageOrderValue}
              value={stats.averageOrderValue}
              formatter={(value) => formatPrice(Number(value))}
              prefix={<LineChartOutlined className="text-purple-500 mr-2 bg-purple-50 p-2 rounded-full" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Sales Trend Chart */}
      <Card title={DASHBOARD_LABELS.salesTrend} variant="borderless" className="shadow-sm border border-gray-100">
        {stats.salesTrend.length === 0 ? (
          <Empty description="Tidak ada data tren penjualan" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.salesTrend} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} />
              <Tooltip
                formatter={(value: any, name: any) => {
                  if (name === "revenue") return [formatPrice(Number(value)), "Pendapatan"];
                  if (name === "orders") return [`${value} Pesanan`, "Jumlah Pesanan"];
                  return [value, name];
                }}
                labelFormatter={(label) => `Tanggal: ${new Date(label).toLocaleDateString("id-ID", { dateStyle: "long" })}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1677ff"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Split details row */}
      <Row gutter={[16, 16]}>
        {/* Top selling products */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="flex items-center gap-2">
                <TrophyOutlined className="text-amber-500" />
                {DASHBOARD_LABELS.topProductsCard}
              </span>
            }
            variant="borderless"
            className="shadow-sm border border-gray-100 h-full"
          >
            {stats.topProducts.length === 0 ? (
              <Empty description="Tidak ada data produk terlaris" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name) => {
                    if (name === "quantity") return [`${value} Unit`, "Kuantitas"];
                    if (name === "revenue") return [formatPrice(Number(value)), "Pendapatan"];
                    return [value, name];
                  }} />
                  <Bar dataKey="quantity" fill="#1677ff" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    {stats.topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Promo code usage */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="flex items-center gap-2">
                <PercentageOutlined className="text-purple-500" />
                {DASHBOARD_LABELS.promoUsageCard}
              </span>
            }
            variant="borderless"
            className="shadow-sm border border-gray-100 h-full"
          >
            {stats.promoUsage.length === 0 ? (
              <Empty description="Tidak ada penggunaan kode promo" />
            ) : (
              <Table
                dataSource={stats.promoUsage}
                rowKey="code"
                size="small"
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: "Kode Promo",
                    dataIndex: "code",
                    key: "code",
                    render: (text) => <Typography.Text code className="font-bold">{text}</Typography.Text>,
                  },
                  {
                    title: "Frekuensi Penggunaan",
                    dataIndex: "count",
                    key: "count",
                    align: "center",
                    render: (text) => <span>{text} x</span>,
                  },
                  {
                    title: "Total Diskon",
                    dataIndex: "discount",
                    key: "discount",
                    align: "right",
                    render: (value) => formatPrice(value),
                  },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
