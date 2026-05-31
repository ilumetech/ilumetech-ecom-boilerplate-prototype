"use client";

import { Button, Descriptions, Modal, Spin, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { PromoCode } from "@ilumetech/types";
import { Can } from "@/components/auth/Can";
import { promoCodeApi } from "@/lib/api/promo-code";
import { PROMO_CODE_LABELS } from "@/lib/labels/promo-code";

interface PromoCodeDetailModalProps {
  promoId: string | null;
  onClose: () => void;
  onEditRequest: (promo: PromoCode) => void;
}

export function PromoCodeDetailModal({
  promoId,
  onClose,
  onEditRequest,
}: PromoCodeDetailModalProps) {
  const isOpen = promoId !== null;

  const { data: promo, isLoading } = useQuery({
    queryKey: ["promos", "detail", promoId],
    queryFn: () => promoCodeApi.getById(promoId!),
    enabled: isOpen,
  });

  function handleEditClick() {
    if (!promo) return;
    onEditRequest(promo);
  }

  const footer = [
    <Can key="edit" permission="promo-code:update">
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={handleEditClick}
        disabled={!promo}
      >
        Edit
      </Button>
    </Can>,
  ];

  function formatPrice(val: number) {
    return `Rp ${val.toLocaleString("id-ID")}`;
  }

  function formatDate(val: string) {
    return new Date(val).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <Modal
      title="Detail Kode Promo"
      open={isOpen}
      onCancel={onClose}
      footer={footer}
      destroyOnHidden={true}
      width={600}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )}
      {promo && (
        <Descriptions column={1} bordered className="mt-4">
          <Descriptions.Item label={PROMO_CODE_LABELS.code}>
            <span className="font-bold tracking-wide">{promo.code}</span>
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.description}>
            {promo.description ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.discountType}>
            {promo.discountType === "PERCENTAGE" ? "Persentase (%)" : "Nominal (Rp)"}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.discountValue}>
            {promo.discountType === "PERCENTAGE"
              ? `${promo.discountValue}%`
              : formatPrice(promo.discountValue)}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.minOrderAmount}>
            {formatPrice(promo.minOrderAmount)}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.maxDiscount}>
            {promo.maxDiscount ? formatPrice(promo.maxDiscount) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.usageLimit}>
            {promo.usageLimit ?? "Tidak terbatas"}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.usedCount}>
            {promo.usedCount}
          </Descriptions.Item>
          <Descriptions.Item label="Masa Berlaku">
            {formatDate(promo.startDate)} s/d {promo.endDate ? formatDate(promo.endDate) : "Selamanya"}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.isActive}>
            {promo.isActive ? (
              <Tag color="success">Aktif</Tag>
            ) : (
              <Tag color="error">Non-aktif</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={PROMO_CODE_LABELS.createdAt}>
            {formatDate(promo.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
