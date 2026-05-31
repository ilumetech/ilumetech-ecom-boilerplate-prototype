"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Input, Space, Table, Tag } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { PromoCode } from "@ilumetech/types";
import { Can } from "@/components/auth/Can";
import { promoCodeApi, type PromoCodeQueryParams } from "@/lib/api/promo-code";
import { PROMO_CODE_LABELS } from "@/lib/labels/promo-code";
import { handleError } from "@/lib/utils/handle-error";
import { PromoCodeDetailModal } from "./PromoCodeDetailModal";
import { PromoCodeFormModal } from "./PromoCodeFormModal";

type FormMode = "create" | "edit";

export function PromoCodeTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null);
  const [queryParams, setQueryParams] = useState<PromoCodeQueryParams>({
    page: 1,
    limit: 10,
  });

  const detailPromoId = searchParams.get("detail");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["promos", "list", queryParams],
    queryFn: () => promoCodeApi.getAll(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => promoCodeApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos", "list"] });
      message.success("Kode promo berhasil dihapus");
    },
    onError: handleError,
  });

  function handleRowClick(promo: PromoCode) {
    router.replace(`/promos?detail=${promo.id}`);
  }

  function handleDetailClose() {
    router.replace("/promos");
  }

  function handleOpenCreate() {
    setEditTarget(null);
    setFormMode("create");
    setFormOpen(true);
  }

  function handleEditRequest(promo: PromoCode) {
    router.replace("/promos");
    setEditTarget(promo);
    setFormMode("edit");
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ["promos", "list"] });
    handleFormClose();
  }

  function confirmDelete(promo: PromoCode) {
    modal.confirm({
      title: "Hapus Kode Promo",
      content: `Apakah Anda yakin ingin menghapus kode promo "${promo.code}"? Tindakan ini tidak dapat dibatalkan.`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => removeMutation.mutate(promo.id),
    });
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<PromoCode> | SorterResult<PromoCode>[],
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

  const columns = buildTableColumns({
    onEdit: handleEditRequest,
    onDelete: confirmDelete,
  });

  return (
    <>
      <div className="flex justify-between mb-4">
        <Space>
          <Can permission="promo-code:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
            >
              Tambah Promo
            </Button>
          </Can>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari kode promo..."
          allowClear
          onSearch={(value) =>
            setQueryParams((previous) => ({
              ...previous,
              page: 1,
              search: value || undefined,
            }))
          }
          style={{ width: 240 }}
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
      <PromoCodeDetailModal
        promoId={detailPromoId}
        onClose={handleDetailClose}
        onEditRequest={handleEditRequest}
      />
      <PromoCodeFormModal
        mode={formMode}
        open={formOpen}
        editTarget={editTarget}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

interface ColumnBuilderParams {
  onEdit: (promo: PromoCode) => void;
  onDelete: (promo: PromoCode) => void;
}

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

function buildTableColumns({
  onEdit,
  onDelete,
}: ColumnBuilderParams): TableColumnsType<PromoCode> {
  return [
    {
      title: PROMO_CODE_LABELS.code,
      dataIndex: "code",
      key: "code",
      sorter: true,
      render: (code: string) => <span className="font-bold tracking-wide">{code}</span>,
    },
    {
      title: PROMO_CODE_LABELS.discountType,
      dataIndex: "discountType",
      key: "discountType",
      render: (type: string) => (type === "PERCENTAGE" ? "Persentase" : "Nominal"),
    },
    {
      title: PROMO_CODE_LABELS.discountValue,
      dataIndex: "discountValue",
      key: "discountValue",
      render: (val: number, record: PromoCode) =>
        record.discountType === "PERCENTAGE"
          ? `${val}%`
          : `Rp ${val.toLocaleString("id-ID")}`,
    },
    {
      title: PROMO_CODE_LABELS.minOrderAmount,
      dataIndex: "minOrderAmount",
      key: "minOrderAmount",
      render: (val: number) => `Rp ${val.toLocaleString("id-ID")}`,
    },
    {
      title: PROMO_CODE_LABELS.usageLimit,
      dataIndex: "usageLimit",
      key: "usageLimit",
      render: (limit: number | null, record: PromoCode) =>
        limit ? `${record.usedCount} / ${limit}` : `${record.usedCount} / ∞`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: PromoCode) => {
        const now = new Date();
        const start = new Date(record.startDate);
        const end = record.endDate ? new Date(record.endDate) : null;
        const limitReached = record.usageLimit !== null && record.usedCount >= record.usageLimit;

        if (!isActive) return <Tag color="error">Non-aktif</Tag>;
        if (now < start) return <Tag color="warning">Terjadwal</Tag>;
        if (end && now > end) return <Tag color="default">Kadaluwarsa</Tag>;
        if (limitReached) return <Tag color="warning">Batas Habis</Tag>;
        return <Tag color="success">Aktif</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: unknown, record: PromoCode) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Can permission="promo-code:update">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Can>
          <Can permission="promo-code:delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Can>
        </Space>
      ),
    },
  ];
}
