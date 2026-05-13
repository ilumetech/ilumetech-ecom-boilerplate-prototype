"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Input, Space, Table, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { Product } from "@ilumetech/types";
import { productApi } from "@/lib/api/product";
import type { ProductQueryParams } from "@/lib/api/product";
import { PRODUCT_LABELS } from "@/lib/labels/product";
import { handleError } from "@/lib/utils/handle-error";
import { Can } from "@/components/auth/Can";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function mapSortOrder(
  antdOrder: "ascend" | "descend" | null | undefined,
): "asc" | "desc" | undefined {
  if (antdOrder === "ascend") return "asc";
  if (antdOrder === "descend") return "desc";
  return undefined;
}

export function ProductTable() {
  const router = useRouter();
  const { modal, message } = App.useApp();
  const queryClient = useQueryClient();

  const [queryParams, setQueryParams] = useState<ProductQueryParams>({ page: 1, limit: 10 });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", "list", queryParams],
    queryFn: () => productApi.getAll(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      message.success("Produk berhasil dihapus");
    },
    onError: handleError,
  });

  function confirmDelete(product: Product) {
    modal.confirm({
      title: "Hapus Produk",
      content: `Apakah Anda yakin ingin menghapus "${product.name}"? Tindakan ini tidak dapat dibatalkan.`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => removeMutation.mutate(product.id),
    });
  }

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Product> | SorterResult<Product>[],
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

  const columns = buildColumns({
    onEdit: (p) => router.push(`/products/${p.id}/edit`),
    onDelete: confirmDelete,
  });

  return (
    <>
      <div className="flex justify-between mb-4">
        <Space>
          <Can permission="product:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/products/new")}
            >
              Tambah Produk
            </Button>
          </Can>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari produk..."
          allowClear
          onSearch={(value) =>
            setQueryParams((prev) => ({ ...prev, page: 1, search: value || undefined }))
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
          pageSizeOptions: ["10", "25", "50"],
        }}
        onRow={(record) => ({ onClick: () => router.push(`/products/${record.id}`) })}
        rowClassName="cursor-pointer"
      />
    </>
  );
}

interface ColumnParams {
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

function buildColumns({ onEdit, onDelete }: ColumnParams): TableColumnsType<Product> {
  return [
    {
      title: PRODUCT_LABELS.code,
      dataIndex: "code",
      key: "code",
      sorter: true,
    },
    {
      title: PRODUCT_LABELS.name,
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: PRODUCT_LABELS.productCategory,
      key: "productCategory",
      render: (_: unknown, record: Product) => record.productCategory.name ?? "—",
    },
    {
      title: PRODUCT_LABELS.unit,
      key: "unit",
      render: (_: unknown, record: Product) => record.unit.name ?? "—",
    },
    {
      title: PRODUCT_LABELS.sellingPrice,
      key: "sellingPrice",
      render: (_: unknown, record: Product) => formatRupiah(record.sellingPrice),
    },
    {
      title: PRODUCT_LABELS.isActive,
      key: "isActive",
      render: (_: unknown, record: Product) =>
        record.isActive ? <Tag color="green">Aktif</Tag> : <Tag color="red">Nonaktif</Tag>,
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: unknown, record: Product) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Can permission="product:update">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Can>
          <Can permission="product:delete">
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
