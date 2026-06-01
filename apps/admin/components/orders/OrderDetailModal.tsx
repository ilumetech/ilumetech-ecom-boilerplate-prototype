"use client";

import { App, Descriptions, Modal, Select, Spin, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType } from "antd";
import type { Order, OrderItem, OrderStatus } from "@ilumetech/types";
import { PERMISSIONS } from "@ilumetech/types";
import { Can } from "@/components/auth/Can";
import { orderApi } from "@/lib/api/order";
import { ORDER_LABELS } from "@/lib/labels/order";
import { handleError } from "@/lib/utils/handle-error";

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

const ALLOWED_NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const isOpen = orderId !== null;
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => orderApi.getById(orderId!),
    enabled: isOpen,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(orderId!, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
      queryClient.setQueryData(["orders", "detail", orderId], response.data);
      message.success("Status pesanan berhasil diperbarui");
    },
    onError: handleError,
  });

  function handleStatusChange(status: OrderStatus) {
    if (!order || status === order.status) return;
    updateStatusMutation.mutate(status);
  }

  return (
    <Modal
      title="Detail Pesanan"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden={true}
      width={900}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )}
      {order && (
        <div className="grid gap-4">
          <Descriptions column={1} bordered>
            <Descriptions.Item label={ORDER_LABELS.orderNumber}>
              <span className="font-semibold">{order.orderNumber}</span>
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.status}>
              <Can permission={PERMISSIONS.ORDER.UPDATE}>
                <Select
                  value={order.status}
                  options={STATUS_OPTIONS.map((status) => ({
                    label: getStatusLabel(status),
                    value: status,
                    disabled:
                      status !== order.status &&
                      !ALLOWED_NEXT_STATUS[order.status].includes(status),
                  }))}
                  onChange={handleStatusChange}
                  loading={updateStatusMutation.isPending}
                  style={{ minWidth: 180 }}
                />
              </Can>
              <span className="ml-2">
                <OrderStatusTag status={order.status} />
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.customerName}>
              {order.customerName}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.customerEmail}>
              {order.customerEmail}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.customerPhone}>
              {order.customerPhone ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.shippingMethod}>
              {order.shippingMethod ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.shippingAddress}>
              {formatAddress(order)}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.createdAt}>
              {formatDate(order.createdAt)}
            </Descriptions.Item>
          </Descriptions>

          <Table
            rowKey="id"
            dataSource={order.items}
            columns={itemColumns}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          />

          <Descriptions column={1} bordered>
            <Descriptions.Item label={ORDER_LABELS.subtotalAmount}>
              {formatPrice(order.subtotalAmount)}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.discountAmount}>
              {formatPrice(order.discountAmount)}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.shippingAmount}>
              {formatPrice(order.shippingAmount)}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.promoCode}>
              {order.promoCode ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label={ORDER_LABELS.totalAmount}>
              <span className="font-semibold">
                {formatPrice(order.totalAmount)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  );
}

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  const colorByStatus: Record<OrderStatus, string> = {
    PENDING: "warning",
    CONFIRMED: "processing",
    PROCESSING: "blue",
    COMPLETED: "success",
    CANCELLED: "error",
  };

  return <Tag color={colorByStatus[status]}>{getStatusLabel(status)}</Tag>;
}

function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Menunggu",
    CONFIRMED: "Dikonfirmasi",
    PROCESSING: "Diproses",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return labels[status];
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

function formatAddress(order: Order): string {
  const address = order.shippingAddress;
  return [
    `${address.firstName} ${address.lastName}`,
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.province} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

const itemColumns: TableColumnsType<OrderItem> = [
  {
    title: "Produk",
    key: "product",
    render: (_: unknown, item: OrderItem) => (
      <div>
        <div className="font-medium">{item.productName}</div>
        <div className="text-xs text-gray-500">
          {item.variantName}
          {item.optionSummary ? ` - ${item.optionSummary}` : ""}
        </div>
      </div>
    ),
  },
  {
    title: "SKU",
    dataIndex: "sku",
    key: "sku",
  },
  {
    title: "Harga",
    dataIndex: "unitPrice",
    key: "unitPrice",
    align: "right",
    render: (value: number) => formatPrice(value),
  },
  {
    title: "Qty",
    dataIndex: "quantity",
    key: "quantity",
    align: "right",
  },
  {
    title: "Total",
    dataIndex: "lineTotal",
    key: "lineTotal",
    align: "right",
    render: (value: number) => formatPrice(value),
  },
];
