"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Select, Space, Table } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { Order, OrderStatus } from "@ilumetech/types";
import { orderApi, type OrderQueryParams } from "@/lib/api/order";
import { ORDER_LABELS } from "@/lib/labels/order";
import { handleError } from "@/lib/utils/handle-error";
import { OrderDetailModal, OrderStatusTag } from "./OrderDetailModal";

const STATUS_FILTERS: { label: string; value: OrderStatus }[] = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Dikonfirmasi", value: "CONFIRMED" },
  { label: "Diproses", value: "PROCESSING" },
  { label: "Selesai", value: "COMPLETED" },
  { label: "Dibatalkan", value: "CANCELLED" },
];

export function OrderTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<OrderQueryParams>({
    page: 1,
    limit: 10,
  });

  const detailOrderId = searchParams.get("detail");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", "list", queryParams],
    queryFn: () => orderApi.getAll(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  function handleRowClick(order: Order) {
    router.replace(`/orders?detail=${order.id}`);
  }

  function handleDetailClose() {
    router.replace("/orders");
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Order> | SorterResult<Order>[],
  ) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setQueryParams({
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
      search: queryParams.search,
      status: queryParams.status,
      sortField: activeSorter?.field as string | undefined,
      sortOrder: mapSortOrder(activeSorter?.order),
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          <Select
            allowClear
            placeholder="Filter status"
            options={STATUS_FILTERS}
            value={queryParams.status}
            onChange={(status) =>
              setQueryParams((previous) => ({
                ...previous,
                page: 1,
                status,
              }))
            }
            style={{ width: 180 }}
          />
        </Space>
        <Input.Search
          placeholder="Cari pesanan..."
          allowClear
          onSearch={(value) =>
            setQueryParams((previous) => ({
              ...previous,
              page: 1,
              search: value || undefined,
            }))
          }
          style={{ width: 260 }}
        />
      </div>
      <Table
        rowKey="id"
        dataSource={data?.data}
        columns={columns}
        loading={isLoading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        pagination={{
          total: data?.meta?.total,
          pageSize: queryParams.limit,
          current: queryParams.page,
          showSizeChanger: true,
        }}
        onRow={(record) => ({ onClick: () => handleRowClick(record) })}
        rowClassName="cursor-pointer"
      />
      <OrderDetailModal orderId={detailOrderId} onClose={handleDetailClose} />
    </>
  );
}

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

function formatPrice(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const columns: TableColumnsType<Order> = [
  {
    title: ORDER_LABELS.orderNumber,
    dataIndex: "orderNumber",
    key: "orderNumber",
    sorter: true,
    render: (value: string) => <span className="font-semibold">{value}</span>,
  },
  {
    title: ORDER_LABELS.customerName,
    dataIndex: "customerName",
    key: "customerName",
  },
  {
    title: ORDER_LABELS.customerEmail,
    dataIndex: "customerEmail",
    key: "customerEmail",
  },
  {
    title: ORDER_LABELS.status,
    dataIndex: "status",
    key: "status",
    render: (status: OrderStatus) => <OrderStatusTag status={status} />,
  },
  {
    title: ORDER_LABELS.totalAmount,
    dataIndex: "totalAmount",
    key: "totalAmount",
    sorter: true,
    align: "right",
    render: (value: number) => formatPrice(value),
  },
  {
    title: ORDER_LABELS.createdAt,
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: true,
    render: (value: string) => formatDate(value),
  },
];
