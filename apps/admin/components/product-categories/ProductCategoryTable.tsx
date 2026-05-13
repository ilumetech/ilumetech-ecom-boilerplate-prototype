"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { App, Button, Input, Space, Table, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult, FilterValue } from "antd/es/table/interface";
import type { ProductCategory } from "@ilumetech/types";
import { productCategoryApi } from "@/lib/api/product-category";
import type { ProductCategoryQueryParams } from "@/lib/api/product-category";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels/product-category";
import { handleError } from "@/lib/utils/handle-error";
import { ProductCategoryDetailModal } from "./ProductCategoryDetailModal";
import { ProductCategoryFormModal } from "./ProductCategoryFormModal";
import { Can } from "@/components/auth/Can";

type FormMode = "create" | "edit";

export function ProductCategoryTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editTarget, setEditTarget] = useState<ProductCategory | null>(null);
  const [queryParams, setQueryParams] = useState<ProductCategoryQueryParams>({ page: 1, limit: 10 });

  const detailCategoryId = searchParams.get("detail");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["productCategories", "list", queryParams],
    queryFn: () => productCategoryApi.getAll(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => productCategoryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories", "list"] });
      message.success("Kategori berhasil dihapus");
    },
    onError: handleError,
  });

  function handleRowClick(category: ProductCategory) {
    router.replace(`/product-categories?detail=${category.id}`);
  }

  function handleDetailClose() {
    router.replace("/product-categories");
  }

  function handleOpenCreate() {
    setEditTarget(null);
    setFormMode("create");
    setFormOpen(true);
  }

  function handleEditRequest(category: ProductCategory) {
    router.replace("/product-categories");
    setEditTarget(category);
    setFormMode("edit");
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditTarget(null);
  }

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ["productCategories", "list"] });
    handleFormClose();
  }

  function confirmDelete(category: ProductCategory) {
    modal.confirm({
      title: "Hapus Kategori",
      content: `Apakah Anda yakin ingin menghapus "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => removeMutation.mutate(category.id),
    });
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ProductCategory> | SorterResult<ProductCategory>[],
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
          <Can permission="product-category:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Tambah Kategori Produk
            </Button>
          </Can>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari kategori..."
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
      <ProductCategoryDetailModal
        categoryId={detailCategoryId}
        onClose={handleDetailClose}
        onEditRequest={handleEditRequest}
      />
      <ProductCategoryFormModal
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
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
}

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

function buildTableColumns({ onEdit, onDelete }: ColumnBuilderParams): TableColumnsType<ProductCategory> {
  return [
    {
      title: PRODUCT_CATEGORY_LABELS.name,
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: PRODUCT_CATEGORY_LABELS.description,
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value: string | null) => value ?? "—",
    },
    {
      title: PRODUCT_CATEGORY_LABELS.isActive,
      key: "isActive",
      filters: [
        { text: "Aktif", value: true },
        { text: "Nonaktif", value: false },
      ],
      filterMultiple: false,
      render: (_: unknown, record: ProductCategory) =>
        record.isActive ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        ),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: unknown, record: ProductCategory) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Can permission="product-category:update">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Can>
          <Can permission="product-category:delete">
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
