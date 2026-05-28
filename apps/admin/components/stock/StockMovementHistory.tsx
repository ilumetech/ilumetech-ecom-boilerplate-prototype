"use client";

import { useEffect, useState } from "react";
import { Empty, Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { StockMovement, StockVariant } from "@ilumetech/types";
import { stockApi } from "@/lib/api/stock";
import type { StockMovementQueryParams } from "@/lib/api/stock";
import { STOCK_LABELS } from "@/lib/labels/stock";
import { handleError } from "@/lib/utils/handle-error";

interface StockMovementHistoryProps {
  variant: StockVariant | null;
}

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

function movementTypeTag(type: StockMovement["type"]) {
  const config = {
    IN: { color: "green", label: "Masuk" },
    OUT: { color: "red", label: "Keluar" },
    ADJUSTMENT: { color: "blue", label: "Penyesuaian" },
  }[type];

  return <Tag color={config.color}>{config.label}</Tag>;
}

export function StockMovementHistory({ variant }: StockMovementHistoryProps) {
  const [queryParams, setQueryParams] = useState<StockMovementQueryParams>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["stock", "movements", variant?.id, queryParams],
    queryFn: () => stockApi.getMovements(variant!.id, queryParams),
    enabled: Boolean(variant),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<StockMovement> | SorterResult<StockMovement>[],
  ) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams({
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
      sortField: activeSorter?.field as string | undefined,
      sortOrder: mapSortOrder(activeSorter?.order),
    });
  }

  if (!variant) {
    return <Empty description={STOCK_LABELS.selectVariant} />;
  }

  return (
    <div>
      <div className="mb-4">
        <Typography.Title level={4} className="m-0!">
          {STOCK_LABELS.movementHistory}
        </Typography.Title>
        <Typography.Text type="secondary">
          {variant.product.name} - {variant.name}
        </Typography.Text>
      </div>
      <Table
        rowKey="id"
        dataSource={data?.data}
        columns={buildMovementColumns()}
        loading={isLoading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        pagination={{
          total: data?.meta.total,
          pageSize: queryParams.limit,
          current: queryParams.page,
          showSizeChanger: true,
          pageSizeOptions: ["10", "25", "50"],
        }}
      />
    </div>
  );
}

function buildMovementColumns(): TableColumnsType<StockMovement> {
  return [
    {
      title: STOCK_LABELS.createdAt,
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (value: string) =>
        new Date(value).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: STOCK_LABELS.movementType,
      dataIndex: "type",
      key: "type",
      sorter: true,
      render: movementTypeTag,
    },
    {
      title: STOCK_LABELS.quantity,
      dataIndex: "quantity",
      key: "quantity",
      sorter: true,
    },
    {
      title: STOCK_LABELS.balanceBefore,
      dataIndex: "balanceBefore",
      key: "balanceBefore",
    },
    {
      title: STOCK_LABELS.balanceAfter,
      dataIndex: "balanceAfter",
      key: "balanceAfter",
    },
    {
      title: STOCK_LABELS.referenceType,
      dataIndex: "referenceType",
      key: "referenceType",
      render: (value: string | null) => value ?? "—",
    },
    {
      title: STOCK_LABELS.referenceId,
      dataIndex: "referenceId",
      key: "referenceId",
      render: (value: string | null) => value ?? "—",
    },
    {
      title: STOCK_LABELS.reason,
      dataIndex: "reason",
      key: "reason",
      render: (value: string | null) => value ?? "—",
    },
  ];
}
