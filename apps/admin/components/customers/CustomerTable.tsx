"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { App, Button, Input, Space, Table, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult, FilterValue } from "antd/es/table/interface";
import type { AppCustomer } from "@ilumetech/types";
import { PERMISSIONS } from "@ilumetech/types";
import { customerApi } from "@/lib/api/customer";
import { CUSTOMER_LABELS } from "@/lib/labels/customer";
import type { CustomerQueryParams } from "@/lib/api/customer";
import { handleError } from "@/lib/utils/handle-error";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { CustomerFormModal } from "./CustomerFormModal";
import { Can } from "@/components/auth/Can";

export function CustomerTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AppCustomer | null>(null);
  const [queryParams, setQueryParams] = useState<CustomerQueryParams>({
    page: 1,
    limit: 10,
  });

  const detailCustomerId = searchParams.get("detail");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customers", "list", queryParams],
    queryFn: () => customerApi.getCustomers(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const removeMutation = useMutation({
    mutationFn: (customerId: string) => customerApi.removeCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
      message.success("Pelanggan berhasil dinonaktifkan");
    },
    onError: handleError,
  });

  function handleRowClick(customer: AppCustomer) {
    router.replace(`/customers?detail=${customer.id}`);
  }

  function handleDetailClose() {
    router.replace("/customers");
  }

  function handleEditRequest(customer: AppCustomer) {
    router.replace("/customers");
    setEditTarget(customer);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
    handleFormClose();
  }

  function confirmDelete(customer: AppCustomer) {
    modal.confirm({
      title: "Hapus/Nonaktifkan Pelanggan",
      content: `Apakah Anda yakin ingin menonaktifkan "${resolveDisplayName(customer)}"? Tindakan ini akan memblokir akses login mereka.`,
      okText: "Nonaktifkan",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => removeMutation.mutate(customer.id),
    });
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<AppCustomer> | SorterResult<AppCustomer>[],
  ) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const isActiveFilter = filters.isActive;
    const isActiveValue =
      Array.isArray(isActiveFilter) && isActiveFilter.length > 0
        ? (isActiveFilter[0] as boolean)
        : undefined;

    setQueryParams({
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
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
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari pelanggan..."
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
      <CustomerDetailModal
        customerId={detailCustomerId}
        onClose={handleDetailClose}
        onEditRequest={handleEditRequest}
      />
      <CustomerFormModal
        open={formOpen}
        editTarget={editTarget}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

function resolveDisplayName(customer: AppCustomer): string {
  if (customer.username) return customer.username;
  const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  return fullName || "—";
}

interface ColumnBuilderParams {
  onEdit: (customer: AppCustomer) => void;
  onDelete: (customer: AppCustomer) => void;
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
}: ColumnBuilderParams): TableColumnsType<AppCustomer> {
  return [
    {
      title: CUSTOMER_LABELS.username,
      key: "displayName",
      render: (_: unknown, record: AppCustomer) => resolveDisplayName(record),
    },
    {
      title: CUSTOMER_LABELS.email,
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: CUSTOMER_LABELS.fullName,
      key: "fullName",
      render: (_: unknown, record: AppCustomer) => {
        const fullName = `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim();
        return fullName || "—";
      },
    },
    {
      title: CUSTOMER_LABELS.isActive,
      key: "isActive",
      filters: [
        { text: "Aktif", value: true },
        { text: "Nonaktif", value: false },
      ],
      filterMultiple: false,
      render: (_: unknown, record: AppCustomer) =>
        record.isActive ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        ),
    },
    {
      title: CUSTOMER_LABELS.createdAt,
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: unknown, record: AppCustomer) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Can permission={PERMISSIONS.CUSTOMER.UPDATE}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Can>
          <Can permission={PERMISSIONS.CUSTOMER.DELETE}>
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
