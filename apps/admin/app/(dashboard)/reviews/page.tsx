"use client";

import { useEffect, useState } from "react";
import { App, Button, Input, Space, Table, Tag, Select, Rate, Typography } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Can } from "@/components/auth/Can";
import { reviewApi, type Review, type ReviewQueryParams } from "@/lib/api/review";
import { handleError } from "@/lib/utils/handle-error";

export default function ReviewsPage() {
  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold m-0">Moderasi Ulasan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Setujui atau tandai ulasan produk dari pelanggan.
        </p>
      </div>
      <PermissionGate permission="product-review:read">
        <ReviewModerationTable />
      </PermissionGate>
    </div>
  );
}

function ReviewModerationTable() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [queryParams, setQueryParams] = useState<ReviewQueryParams>({
    page: 1,
    limit: 10,
    status: undefined,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["reviews", "list", queryParams],
    queryFn: () => reviewApi.getAll(queryParams),
  });

  useEffect(() => {
    if (!isError) return;
    handleError(error);
  }, [isError, error]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "FLAGGED" }) =>
      reviewApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "list"] });
      const verb = variables.status === "APPROVED" ? "disetujui" : "ditandai/ditolak";
      message.success(`Ulasan berhasil ${verb}`);
    },
    onError: handleError,
  });

  function handleTableChange(
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Review> | SorterResult<Review>[],
  ) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setQueryParams((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
      sortField: activeSorter?.field as string | undefined,
      sortOrder: mapSortOrder(activeSorter?.order),
    }));
  }

  function mapSortOrder(
    antdOrder: "ascend" | "descend" | null | undefined,
  ): "asc" | "desc" | undefined {
    if (antdOrder === "ascend") return "asc";
    if (antdOrder === "descend") return "desc";
    return undefined;
  }

  const columns: TableColumnsType<Review> = [
    {
      title: "Produk",
      key: "product",
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.product.name}</Typography.Text>
          <div className="text-xs text-gray-400">{record.product.code}</div>
        </div>
      ),
    },
    {
      title: "Pelanggan",
      key: "customer",
      render: (_, record) => {
        const name = `${record.customer.firstName ?? ""} ${record.customer.lastName ?? ""}`.trim();
        return (
          <div>
            <Typography.Text>{name || "Pelanggan"}</Typography.Text>
            <div className="text-xs text-gray-400">{record.customer.email}</div>
          </div>
        );
      },
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      sorter: true,
      render: (rating: number) => (
        <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
      ),
    },
    {
      title: "Komentar",
      dataIndex: "comment",
      key: "comment",
      render: (comment: string | null) => (
        <Typography.Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'selengkapnya' }} style={{ margin: 0, fontSize: 13, maxWidth: 300 }}>
          {comment || <span className="text-gray-300 italic">Tidak ada komentar</span>}
        </Typography.Paragraph>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Review["status"]) => {
        let color = "orange";
        let text = "PENDING";
        if (status === "APPROVED") {
          color = "green";
          text = "DISETUJUI";
        } else if (status === "FLAGGED") {
          color = "red";
          text = "FLAGGED";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Can permission="product-review:update">
            {record.status !== "APPROVED" && (
              <Button
                type="text"
                style={{ color: "#52c41a" }}
                icon={<CheckOutlined />}
                onClick={() => updateStatusMutation.mutate({ id: record.id, status: "APPROVED" })}
              >
                Setujui
              </Button>
            )}
            {record.status !== "FLAGGED" && (
              <Button
                type="text"
                danger
                icon={<CloseOutlined />}
                onClick={() => updateStatusMutation.mutate({ id: record.id, status: "FLAGGED" })}
              >
                Tandai
              </Button>
            )}
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <Space>
          <Select
            placeholder="Filter Status"
            allowClear
            style={{ width: 150 }}
            onChange={(value) =>
              setQueryParams((prev) => ({
                ...prev,
                page: 1,
                status: value || undefined,
              }))
            }
            options={[
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Disetujui" },
              { value: "FLAGGED", label: "Tandai (Flagged)" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
        <Input.Search
          placeholder="Cari komentar ulasan..."
          allowClear
          onSearch={(value) =>
            setQueryParams((prev) => ({
              ...prev,
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
      />
    </>
  );
}
