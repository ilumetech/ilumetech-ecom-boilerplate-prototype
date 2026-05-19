"use client";

import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Descriptions,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { PERMISSIONS } from "@ilumetech/types";
import { productApi } from "@/lib/api/product";
import { PRODUCT_LABELS } from "@/lib/labels/product";
import { handleError } from "@/lib/utils/handle-error";
import { useCan } from "@/lib/hooks/use-can";
import type { ProductVariant } from "@ilumetech/types";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface ProductDetailViewProps {
  productId: string;
}

function formatDiscount(variant: ProductVariant): string {
  if (!variant.discountMode) return "Tidak ada";
  if (variant.discountMode === "MANUAL") return "Manual";
  if (variant.discountType === "PERCENTAGE")
    return `${variant.discountValue ?? 0}%`;
  return formatRupiah(variant.discountValue ?? 0);
}

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const canViewCost = useCan(PERMISSIONS.PRODUCT.VIEW_COST);

  const { data: product, isLoading } = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: () => productApi.getById(productId),
    throwOnError: (error) => {
      handleError(error);
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Typography.Title level={4} className="m-0">
            {product.name}
          </Typography.Title>
          <Typography.Text type="secondary" className="text-sm">
            {product.code}
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/products")}
          >
            Kembali
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/products/${productId}/edit`)}
          >
            Edit
          </Button>
        </Space>
      </div>

      <Descriptions column={1} bordered>
        <Descriptions.Item label={PRODUCT_LABELS.code}>
          <Typography.Text code>{product.code}</Typography.Text>
          <Typography.Text type="secondary" className="ml-2 text-xs">
            (otomatis)
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.name}>
          {product.name}
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.description}>
          {product.description ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.productCategory}>
          {product.productCategory.name}
        </Descriptions.Item>

        <Descriptions.Item label={PRODUCT_LABELS.badge}>
          {product.badge ? (
            <Tag
              color={
                product.badge === "New Arrival"
                  ? "green"
                  : product.badge === "Bestseller"
                    ? "gold"
                    : product.badge === "Limited Edition"
                      ? "purple"
                      : product.badge === "On Sale"
                        ? "red"
                        : "blue"
              }
            >
              {product.badge}
            </Tag>
          ) : (
            "—"
          )}
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.unit}>
          {product.unit.name} ({product.unit.abbreviation})
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.sellingPrice}>
          {formatRupiah(product.sellingPrice)}
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.finalPrice}>
          {formatRupiah(
            product.variants?.[0]?.finalPrice ?? product.sellingPrice,
          )}
        </Descriptions.Item>
        {canViewCost && (
          <Descriptions.Item label={PRODUCT_LABELS.purchasePrice}>
            {product.purchasePrice !== null
              ? formatRupiah(product.purchasePrice)
              : "—"}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={PRODUCT_LABELS.weightGram}>
          {product.weightGram !== null ? `${product.weightGram} gram` : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.isActive}>
          {product.isActive ? (
            <Tag color="green">Aktif</Tag>
          ) : (
            <Tag color="red">Nonaktif</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={PRODUCT_LABELS.createdAt}>
          {new Date(product.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Descriptions.Item>
      </Descriptions>

      {product.variants && product.variants.length > 0 && (
        <div className="mt-6">
          <Typography.Title level={5}>Varian</Typography.Title>
          <Table
            rowKey="id"
            dataSource={product.variants}
            pagination={false}
            columns={[
              { title: "SKU", dataIndex: "sku", key: "sku" },
              { title: "Varian", dataIndex: "name", key: "name" },
              {
                title: "Harga",
                key: "price",
                render: (_: unknown, variant: ProductVariant) =>
                  formatRupiah(variant.price),
              },
              {
                title: PRODUCT_LABELS.finalPrice,
                key: "finalPrice",
                render: (_: unknown, variant: ProductVariant) =>
                  formatRupiah(variant.finalPrice),
              },
              {
                title: "Diskon",
                key: "discount",
                render: (_: unknown, variant: ProductVariant) =>
                  formatDiscount(variant),
              },
              {
                title: PRODUCT_LABELS.isActive,
                key: "isActive",
                render: (_: unknown, variant: ProductVariant) =>
                  variant.isActive ? (
                    <Tag color="green">Aktif</Tag>
                  ) : (
                    <Tag color="red">Nonaktif</Tag>
                  ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
