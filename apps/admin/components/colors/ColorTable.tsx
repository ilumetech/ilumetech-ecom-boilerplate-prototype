"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Input, Space, Table } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { Color } from "@ilumetech/types";
import { Can } from "@/components/auth/Can";
import { colorApi } from "@/lib/api/color";
import type { ColorQueryParams } from "@/lib/api/color";
import { COLOR_LABELS } from "@/lib/labels/color";
import { handleError } from "@/lib/utils/handle-error";
import { ColorDetailModal } from "./ColorDetailModal";
import { ColorFormModal } from "./ColorFormModal";

type FormMode = "create" | "edit";

export function ColorTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editTarget, setEditTarget] = useState<Color | null>(null);
  const [queryParams, setQueryParams] = useState<ColorQueryParams>({ page: 1, limit: 10 });

  const detailColorId = searchParams.get("detail");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["colors", "list", queryParams],
    queryFn: () => colorApi.getAll(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => colorApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors", "list"] });
      message.success("Warna berhasil dihapus");
    },
    onError: handleError,
  });

  function handleRowClick(color: Color) {
    router.replace(`/colors?detail=${color.id}`);
  }

  function handleDetailClose() {
    router.replace("/colors");
  }

  function handleOpenCreate() {
    setEditTarget(null);
    setFormMode("create");
    setFormOpen(true);
  }

  function handleEditRequest(color: Color) {
    router.replace("/colors");
    setEditTarget(color);
    setFormMode("edit");
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ["colors", "list"] });
    handleFormClose();
  }

  function confirmDelete(color: Color) {
    modal.confirm({
      title: "Hapus Warna",
      content: `Apakah Anda yakin ingin menghapus "${color.name}"? Tindakan ini tidak dapat dibatalkan.`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => removeMutation.mutate(color.id),
    });
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Color> | SorterResult<Color>[],
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
          <Can permission="color:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Tambah Warna
            </Button>
          </Can>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari warna..."
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
        pagination={{
          total: data?.meta?.total,
          pageSize: queryParams.limit,
          current: queryParams.page,
          showSizeChanger: true,
        }}
        onRow={(record) => ({ onClick: () => handleRowClick(record) })}
        rowClassName="cursor-pointer"
      />
      <ColorDetailModal
        colorId={detailColorId}
        onClose={handleDetailClose}
        onEditRequest={handleEditRequest}
      />
      <ColorFormModal
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
  onEdit: (color: Color) => void;
  onDelete: (color: Color) => void;
}

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

function buildTableColumns({ onEdit, onDelete }: ColumnBuilderParams): TableColumnsType<Color> {
  return [
    {
      title: COLOR_LABELS.name,
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: unknown, record: Color) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Can permission="color:update">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Can>
          <Can permission="color:delete">
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
