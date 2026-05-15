"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product";
import { productCategoryApi } from "@/lib/api/product-category";
import { colorApi } from "@/lib/api/color";
import { unitApi } from "@/lib/api/unit";
import { PRODUCT_LABELS } from "@/lib/labels/product";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";
import { slugify } from "@/lib/utils/string";
import { handleError } from "@/lib/utils/handle-error";


interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

interface FormValues {
  name: string;
  slug?: string;
  description?: string;
  colorId?: string;
  badge?: string;
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  
  const [categorySearch, setCategorySearch] = useState("");
  const [colorwaySearch, setColorwaySearch] = useState("");
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

  const { data: colorsData } = useQuery({
    queryKey: ["colors", "list", { limit: 100 }],
    queryFn: () => colorApi.getAll({ limit: 100 }),
  });

  const { data: product } = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: () => productApi.getById(productId!),
    enabled: isEditMode,
  });

  const buildOriginalValues = useCallback((): Partial<FormValues> => {
    return {
      name: product!.name,
      slug: product!.slug,
      description: product!.description ?? undefined,
      colorId: product!.colorId ?? undefined,
      badge: product!.badge ?? undefined,
      productCategoryId: product!.productCategoryId,
      unitId: product!.unitId,
      sellingPrice: product!.sellingPrice,
      purchasePrice: product!.purchasePrice ?? undefined,
      isActive: product!.isActive,
    };
  }, [product]);

  const isFormDirty = useCallback((): boolean => {
    if (isEditMode && product) {
      const currentValues = form.getFieldsValue();
      return Object.keys(getDirtyFields(
        currentValues as FormValues & Record<string, unknown>,
        buildOriginalValues() as FormValues & Record<string, unknown>,
      )).length > 0;
    }
    return form.isFieldsTouched();
  }, [buildOriginalValues, form, isEditMode, product]);

  useEffect(() => {
    if (!product || !isEditMode) return;
    form.resetFields();
    form.setFieldsValue({
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      colorId: product.colorId ?? undefined,
      badge: product.badge ?? undefined,
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
  }, [isFormDirty]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      productApi.create({
        name: values.name,
        slug: values.slug,
        description: values.description,
        colorId: values.colorId,
        badge: values.badge,
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

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => productCategoryApi.create({ name }),
    onSuccess: (response) => {
      message.success(`Kategori "${response.data.name}" berhasil dibuat`);
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      form.setFieldValue("productCategoryId", response.data.id);
      setCategorySearch("");
    },
    onError: handleError,
  });

  const createColorMutation = useMutation({
    mutationFn: (name: string) => colorApi.create({ name }),
    onSuccess: (response) => {
      message.success(`Warna "${response.data.name}" berhasil dibuat`);
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      form.setFieldValue("colorId", response.data.id);
      setColorwaySearch("");
    },
    onError: handleError,
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    createCategoryMutation.isPending ||
    createColorMutation.isPending;

  function handleFinish(values: FormValues) {
    if (!isEditMode) {
      createMutation.mutate(values);
      return;
    }
    const dirtyFields = getDirtyFields(
      {
        name: values.name,
        slug: values.slug,
        description: values.description,
        colorId: values.colorId,
        badge: values.badge,
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

  const categoryOptions = useMemo(() => {
    const options = (categoriesData?.data ?? []).map((c) => ({
      label: c.name,
      value: c.id,
    }));

    if (categorySearch && !options.some(opt => opt.label.toLowerCase() === categorySearch.toLowerCase())) {
      options.push({
        label: `+ Tambah "${categorySearch}"`,
        value: `CREATE_${categorySearch}`,
      });
    }
    return options;
  }, [categoriesData, categorySearch]);

  const colorOptions = useMemo(() => {
    const options = (colorsData?.data ?? []).map((c) => ({
      label: c.name,
      value: c.id,
    }));

    if (colorwaySearch && !options.some(opt => opt.label.toLowerCase() === colorwaySearch.toLowerCase())) {
      options.push({
        label: `+ Tambah "${colorwaySearch}"`,
        value: `CREATE_${colorwaySearch}`,
      });
    }
    return options;
  }, [colorsData, colorwaySearch]);

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

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="colorId" label={PRODUCT_LABELS.color}>
            <Select
              showSearch
              placeholder="Pilih warna"
              options={colorOptions}
              onSearch={setColorwaySearch}
              onSelect={(value) => {
                const selectedValue = value.toString();
                if (selectedValue.startsWith("CREATE_")) {
                  const newName = selectedValue.replace("CREATE_", "");
                  createColorMutation.mutate(newName);
                } else {
                  setColorwaySearch("");
                }
              }}
              filterOption={(input, option) =>
                (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            />
          </Form.Item>

          <Form.Item name="badge" label={PRODUCT_LABELS.badge}>
            <Select 
              allowClear
              options={[
                { label: 'New Arrival', value: 'New Arrival' },
                { label: 'Bestseller', value: 'Bestseller' },
                { label: 'Limited Edition', value: 'Limited Edition' },
                { label: 'On Sale', value: 'On Sale' },
              ]}
              placeholder="Pilih badge"
            />
          </Form.Item>
        </div>


        <Form.Item
          name="productCategoryId"
          label={PRODUCT_LABELS.productCategory}
          rules={[{ required: true, message: "Kategori wajib dipilih" }]}
        >
          <Select
            options={categoryOptions}
            placeholder="Pilih kategori"
            showSearch
            onSearch={setCategorySearch}
            onSelect={(value) => {
              if (value.toString().startsWith("CREATE_")) {
                const newName = value.toString().replace("CREATE_", "");
                createCategoryMutation.mutate(newName);
              } else {
                setCategorySearch("");
              }
            }}
            filterOption={(input, option) =>
              (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
            }
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
