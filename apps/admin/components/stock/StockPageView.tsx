"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Card, Input, Space, Table, Tag } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { StockVariant } from "@ilumetech/types";
import { PERMISSIONS } from "@ilumetech/types";
import { Can } from "@/components/auth/Can";
import { stockApi } from "@/lib/api/stock";
import type { StockVariantQueryParams } from "@/lib/api/stock";
import { STOCK_LABELS } from "@/lib/labels/stock";
import { handleError } from "@/lib/utils/handle-error";
import { StockMovementFormModal } from "./StockMovementFormModal";
import { StockMovementHistory } from "./StockMovementHistory";

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

export function StockPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const selectedVariantId = searchParams.get("variant");

  const [movementVariant, setMovementVariant] = useState<StockVariant | null>(
    null,
  );
  const [queryParams, setQueryParams] = useState<StockVariantQueryParams>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["stock", "variants", queryParams],
    queryFn: () => stockApi.getVariants(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const selectedVariant = useMemo(
    () =>
      data?.data.find((variant) => variant.id === selectedVariantId) ?? null,
    [data?.data, selectedVariantId],
  );

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<StockVariant> | SorterResult<StockVariant>[],
  ) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams({
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
      search: queryParams.search,
      sortField: activeSorter?.field as string | undefined,
      sortOrder: mapSortOrder(activeSorter?.order),
    });
  }

  function selectVariant(variant: StockVariant) {
    router.replace(`/stock?variant=${variant.id}`);
  }

  function openMovementForm(variant: StockVariant) {
    if (!variant.isActive) {
      message.warning("Varian nonaktif tidak dapat dimutasi");
      return;
    }
    setMovementVariant(variant);
  }

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          </Space>
          <Input.Search
            placeholder="Cari SKU atau varian..."
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
          columns={buildVariantColumns({ onCreateMovement: openMovementForm })}
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
          onRow={(record) => ({ onClick: () => selectVariant(record) })}
          rowClassName={(record) =>
            record.id === selectedVariantId
              ? "cursor-pointer font-medium"
              : "cursor-pointer"
          }
        />
      </Card>
      <Card>
        <StockMovementHistory variant={selectedVariant} />
      </Card>
      <StockMovementFormModal
        open={Boolean(movementVariant)}
        variant={movementVariant}
        onClose={() => setMovementVariant(null)}
      />
    </div>
  );
}

interface VariantColumnParams {
  onCreateMovement: (variant: StockVariant) => void;
}

function buildVariantColumns({
  onCreateMovement,
}: VariantColumnParams): TableColumnsType<StockVariant> {
  return [
    {
      title: STOCK_LABELS.productCode,
      dataIndex: ["product", "code"],
      key: "productCode",
      render: (_: unknown, record: StockVariant) => record.product.code,
    },
    {
      title: STOCK_LABELS.productName,
      dataIndex: ["product", "name"],
      key: "productName",
      render: (_: unknown, record: StockVariant) => record.product.name,
    },
    {
      title: STOCK_LABELS.sku,
      dataIndex: "sku",
      key: "sku",
      sorter: true,
    },
    {
      title: STOCK_LABELS.variantName,
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: STOCK_LABELS.stockOnHand,
      dataIndex: "stockOnHand",
      key: "stockOnHand",
      sorter: true,
      render: (value: number) => (
        <Tag color={value > 0 ? "green" : "red"}>{value}</Tag>
      ),
    },
    {
      title: STOCK_LABELS.isActive,
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) =>
        isActive ? <Tag color="green">Aktif</Tag> : <Tag>Nonaktif</Tag>,
    },
    {
      title: STOCK_LABELS.actions,
      key: "actions",
      render: (_: unknown, record: StockVariant) => (
        <Space size="small" onClick={(event) => event.stopPropagation()}>
          <Can permission={PERMISSIONS.STOCK.UPDATE}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={() => onCreateMovement(record)}
            />
          </Can>
        </Space>
      ),
    },
  ];
}
