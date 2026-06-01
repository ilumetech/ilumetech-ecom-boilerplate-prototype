"use client";

import { Button, Descriptions, Modal, Spin, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { AppCustomer } from "@ilumetech/types";
import { customerApi } from "@/lib/api/customer";
import { CUSTOMER_LABELS } from "@/lib/labels/customer";

interface CustomerDetailModalProps {
  customerId: string | null;
  onClose: () => void;
  onEditRequest: (customer: AppCustomer) => void;
}

export function CustomerDetailModal({
  customerId,
  onClose,
  onEditRequest,
}: CustomerDetailModalProps) {
  const isOpen = customerId !== null;

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => customerApi.getCustomer(customerId!),
    enabled: isOpen,
  });

  function handleEditClick() {
    if (!customer) return;
    onEditRequest(customer);
  }

  const footer = [
    <Button key="close" onClick={onClose}>
      Tutup
    </Button>,
    <Button
      key="edit"
      type="primary"
      onClick={handleEditClick}
      disabled={!customer}
    >
      Edit
    </Button>,
  ];

  return (
    <Modal
      title="Detail Pelanggan"
      open={isOpen}
      onCancel={onClose}
      footer={footer}
      destroyOnClose={true}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )}
      {customer && <CustomerDescriptions customer={customer} />}
    </Modal>
  );
}

function CustomerDescriptions({ customer }: { customer: AppCustomer }) {
  const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  const displayName = customer.username ?? fullName ?? "—";

  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label={CUSTOMER_LABELS.username}>
        {displayName}
      </Descriptions.Item>
      <Descriptions.Item label={CUSTOMER_LABELS.email}>
        {customer.email || "—"}
      </Descriptions.Item>
      <Descriptions.Item label={CUSTOMER_LABELS.fullName}>
        {fullName || "—"}
      </Descriptions.Item>
      <Descriptions.Item label={CUSTOMER_LABELS.isActive}>
        {customer.isActive ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label={CUSTOMER_LABELS.createdAt}>
        {new Date(customer.createdAt).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Descriptions.Item>
    </Descriptions>
  );
}
