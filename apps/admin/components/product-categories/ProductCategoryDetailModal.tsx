"use client";

import { Button, Descriptions, Modal, Spin, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { ProductCategory } from "@ilumetech/types";
import { PERMISSIONS } from "@ilumetech/types";
import { productCategoryApi } from "@/lib/api/product-category";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels/product-category";
import { Can } from "@/components/auth/Can";

interface ProductCategoryDetailModalProps {
  categoryId: string | null;
  onClose: () => void;
  onEditRequest: (category: ProductCategory) => void;
}

export function ProductCategoryDetailModal({
  categoryId,
  onClose,
  onEditRequest,
}: ProductCategoryDetailModalProps) {
  const isOpen = categoryId !== null;

  const { data: category, isLoading } = useQuery({
    queryKey: ["productCategories", "detail", categoryId],
    queryFn: () => productCategoryApi.getById(categoryId!),
    enabled: isOpen,
  });

  function handleEditClick() {
    if (!category) return;
    onEditRequest(category);
  }

  const footer = [
    <Button key="close" onClick={onClose}>
      Tutup
    </Button>,
    <Can key="edit" permission={PERMISSIONS.PRODUCT_CATEGORY.UPDATE}>
      <Button type="primary" onClick={handleEditClick} disabled={!category}>
        Edit
      </Button>
    </Can>,
  ];

  return (
    <Modal
      title="Detail Kategori Produk"
      open={isOpen}
      onCancel={onClose}
      footer={footer}
      destroyOnHidden={true}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )}
      {category && <CategoryDescriptions category={category} />}
    </Modal>
  );
}

function CategoryDescriptions({ category }: { category: ProductCategory }) {
  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label={PRODUCT_CATEGORY_LABELS.name}>
        {category.name}
      </Descriptions.Item>
      <Descriptions.Item label={PRODUCT_CATEGORY_LABELS.description}>
        {category.description ?? "—"}
      </Descriptions.Item>
      <Descriptions.Item label={PRODUCT_CATEGORY_LABELS.isActive}>
        {category.isActive ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label={PRODUCT_CATEGORY_LABELS.createdAt}>
        {new Date(category.createdAt).toLocaleDateString("id-ID")}
      </Descriptions.Item>
    </Descriptions>
  );
}
