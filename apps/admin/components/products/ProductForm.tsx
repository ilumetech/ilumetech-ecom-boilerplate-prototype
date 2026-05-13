"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product";
import { productCategoryApi } from "@/lib/api/product-category";
import { unitApi } from "@/lib/api/unit";
import { PRODUCT_LABELS } from "@/lib/labels/product";
import { handleError } from "@/lib/utils/handle-error";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

interface FormValues {
  name: string;
  description?: string;
  productCategoryId: string;
  unitId: string;
  sellingPrice: number;
  purchasePrice?: number;
  isActive: boolean;
}

const RUPIAH_FORMATTER = {
  formatter: (value: number | undefined) =>
    value !== undefined ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "",
  parser: (value: string | undefined) => Number(value?.replace(/\./g, "") ?? 0),
};

export function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEditMode = mode === "edit";
  const cancelTarget = isEditMode ? `/products/${productId}` : "/products";

  const { data: categoriesData } = useQuery({
    queryKey: ["productCategories", "list", { isActive: true, limit: 100 }],
    queryFn: () => productCategoryApi.getAll({ isActive: true, limit: 100 }),
  });

  const { data: units } = useQuery({
    queryKey: ["units", "list"],
    queryFn: unitApi.getAll,
  });

  const { data: product } = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: () => productApi.getById(productId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!product || !isEditMode) return;
    form.resetFields();
    form.setFieldsValue({
      name: product.name,
      description: product.description ?? undefined,
      productCategoryId: product.productCategoryId,
      unitId: product.unitId,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice ?? undefined,
      isActive: product.isActive,
    });
  }, [product, form, isEditMode]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isFormDirty()) e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, product, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      productApi.create({
        name: values.name,
        description: values.description,
        productCategoryId: values.productCategoryId,
        unitId: values.unitId,
        sellingPrice: values.sellingPrice,
        purchasePrice: values.purchasePrice,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      message.success("Produk berhasil dibuat");
      router.push("/products");
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<FormValues>) =>
      productApi.update(productId!, payload),
    onSuccess: () => {
      message.success("Produk berhasil diperbarui");
      router.push(`/products/${productId}`);
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function buildOriginalValues(): Partial<FormValues> {
    return {
      name: product!.name,
      description: product!.description ?? undefined,
      productCategoryId: product!.productCategoryId,
      unitId: product!.unitId,
      sellingPrice: product!.sellingPrice,
      purchasePrice: product!.purchasePrice ?? undefined,
      isActive: product!.isActive,
    };
  }

  function isFormDirty(): boolean {
    if (isEditMode && product) {
      const currentValues = form.getFieldsValue();
      return Object.keys(getDirtyFields(
        currentValues as FormValues & Record<string, unknown>,
        buildOriginalValues() as FormValues & Record<string, unknown>,
      )).length > 0;
    }
    return form.isFieldsTouched();
  }

  function handleFinish(values: FormValues) {
    if (!isEditMode) {
      createMutation.mutate(values);
      return;
    }
    const dirtyFields = getDirtyFields(
      {
        name: values.name,
        description: values.description,
        productCategoryId: values.productCategoryId,
        unitId: values.unitId,
        sellingPrice: values.sellingPrice,
        purchasePrice: values.purchasePrice,
        isActive: values.isActive,
      },
      buildOriginalValues(),
    );
    if (Object.keys(dirtyFields).length === 0) {
      message.info("Tidak ada perubahan");
      return;
    }
    updateMutation.mutate(dirtyFields);
  }

  function handleCancel() {
    if (!isFormDirty()) {
      router.push(cancelTarget);
      return;
    }
    modal.confirm({
      title: "Perubahan belum disimpan",
      content:
        "Apakah Anda yakin ingin meninggalkan halaman ini? Perubahan akan hilang.",
      okText: "Tinggalkan",
      cancelText: "Kembali",
      onOk: () => router.push(cancelTarget),
    });
  }

  const categoryOptions = (categoriesData?.data ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const unitOptions = (units ?? []).map((u) => ({
    label: `${u.name} (${u.abbreviation})`,
    value: u.id,
  }));

  return (
    <div className="max-w-2xl">
      {isEditMode && product && (
        <div className="mb-4">
          <Typography.Text type="secondary">
            {PRODUCT_LABELS.code}:{" "}
          </Typography.Text>
          <Typography.Text code>{product.code}</Typography.Text>
        </div>
      )}
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ isActive: true }}>
        <Form.Item
          name="name"
          label={PRODUCT_LABELS.name}
          rules={[{ required: true, message: "Nama produk wajib diisi" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="description" label={PRODUCT_LABELS.description}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="productCategoryId"
          label={PRODUCT_LABELS.productCategory}
          rules={[{ required: true, message: "Kategori wajib dipilih" }]}
        >
          <Select
            options={categoryOptions}
            placeholder="Pilih kategori"
            showSearch
          />
        </Form.Item>

        <Form.Item
          name="unitId"
          label={PRODUCT_LABELS.unit}
          rules={[{ required: true, message: "Satuan wajib dipilih" }]}
        >
          <Select options={unitOptions} placeholder="Pilih satuan" />
        </Form.Item>

        <Form.Item
          name="sellingPrice"
          label={PRODUCT_LABELS.sellingPrice}
          rules={[{ required: true, message: "Harga jual wajib diisi" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            prefix="Rp"
            {...RUPIAH_FORMATTER}
            min={0}
            precision={0}
          />
        </Form.Item>

        <Form.Item name="purchasePrice" label={PRODUCT_LABELS.purchasePrice}>
          <InputNumber
            style={{ width: "100%" }}
            prefix="Rp"
            {...RUPIAH_FORMATTER}
            min={0}
            precision={0}
          />
        </Form.Item>

        <Form.Item
          name="isActive"
          label={PRODUCT_LABELS.isActive}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isPending}>
              Simpan
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Batal
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
