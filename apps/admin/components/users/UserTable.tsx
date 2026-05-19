"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { App, Button, Input, Space, Table, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult, FilterValue } from "antd/es/table/interface";
import type { AppUser } from "@ilumetech/types";
import { PERMISSIONS } from "@ilumetech/types";
import { userApi } from "@/lib/api/user";
import { USER_LABELS } from "@/lib/labels/user";
import type { UserQueryParams } from "@/lib/api/user";
import { handleError } from "@/lib/utils/handle-error";
import { UserDetailModal } from "./UserDetailModal";
import { UserFormModal } from "./UserFormModal";
import { Can } from "@/components/auth/Can";

type FormMode = "create" | "edit";

export function UserTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
  });

  const detailUserId = searchParams.get("detail");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", "list", queryParams],
    queryFn: () => userApi.getUsers(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const removeMutation = useMutation({
    mutationFn: (userId: string) => userApi.removeUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      message.success("Pengguna berhasil dihapus");
    },
    onError: handleError,
  });

  function handleRowClick(user: AppUser) {
    router.replace(`/users?detail=${user.id}`);
  }

  function handleDetailClose() {
    router.replace("/users");
  }

  function handleOpenCreate() {
    setEditTarget(null);
    setFormMode("create");
    setFormOpen(true);
  }

  function handleEditRequest(user: AppUser) {
    router.replace("/users");
    setEditTarget(user);
    setFormMode("edit");
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    handleFormClose();
  }

  function confirmDelete(user: AppUser) {
    modal.confirm({
      title: "Hapus Pengguna",
      content: `Apakah Anda yakin ingin menghapus "${resolveDisplayName(user)}"? Tindakan ini tidak dapat dibatalkan.`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => removeMutation.mutate(user.id),
    });
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<AppUser> | SorterResult<AppUser>[],
  ) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const isActiveFilter = filters.isActive;
    const isActiveValue =
      Array.isArray(isActiveFilter) && isActiveFilter.length > 0
        ? (isActiveFilter[0] as boolean)
        : undefined;

    setQueryParams({
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 20,
      search: queryParams.search,
      sortField: activeSorter?.field as string | undefined,
      sortOrder: mapSortOrder(activeSorter?.order),
      isActive: isActiveValue,
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
          <Can permission={PERMISSIONS.USER.INVITE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
            >
              Tambah Pengguna
            </Button>
          </Can>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari pengguna..."
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
      <UserDetailModal
        userId={detailUserId}
        onClose={handleDetailClose}
        onEditRequest={handleEditRequest}
      />
      <UserFormModal
        mode={formMode}
        open={formOpen}
        editTarget={editTarget}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

function resolveDisplayName(user: AppUser): string {
  if (user.username) return user.username;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || "—";
}

interface ColumnBuilderParams {
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
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
}: ColumnBuilderParams): TableColumnsType<AppUser> {
  return [
    {
      title: USER_LABELS.username,
      key: "displayName",
      render: (_: unknown, record: AppUser) => resolveDisplayName(record),
    },
    {
      title: USER_LABELS.email,
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: USER_LABELS.role,
      key: "primaryRole",
      render: (_: unknown, record: AppUser) => record.primaryRole ?? "—",
    },
    {
      title: USER_LABELS.isActive,
      key: "isActive",
      filters: [
        { text: "Aktif", value: true },
        { text: "Nonaktif", value: false },
      ],
      filterMultiple: false,
      render: (_: unknown, record: AppUser) =>
        record.isActive ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        ),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: unknown, record: AppUser) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Can permission={PERMISSIONS.USER.UPDATE}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Can>
          <Can permission={PERMISSIONS.USER.DELETE}>
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
