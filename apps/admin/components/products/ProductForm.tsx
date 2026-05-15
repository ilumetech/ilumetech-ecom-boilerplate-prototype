"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product";
import { productCategoryApi } from "@/lib/api/product-category";
import { colorApi } from "@/lib/api/color";
import { unitApi } from "@/lib/api/unit";
import { PRODUCT_LABELS } from "@/lib/labels/product";
import { COLOR_LABELS } from "@/lib/labels/color";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";
import { slugify } from "@/lib/utils/string";
import { handleError } from "@/lib/utils/handle-error";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

interface FormOptionValue {
  id?: string;
  value: string;
}

interface FormOption {
  name: string;
  values: FormOptionValue[];
}

interface FormVariant {
  id?: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  optionValues: { optionName: string; value: string }[];
  tempOptionValueIds?: string[];
  isActive: boolean;
  isDefault: boolean;
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
  weightGram?: number;
  isActive: boolean;
  options?: FormOption[];
  variants?: FormVariant[];
}

const RUPIAH_FORMATTER = {
  formatter: (value: number | undefined) =>
    value !== undefined ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "",
  parser: (value: string | undefined) => Number(value?.replace(/\./g, "") ?? 0),
};

const PRESET_OPTIONS = [
  { label: "Warna", value: "Warna" },
  { label: "Size", value: "Size" },
  { label: "Size (Run)", value: "Size (Run)" },
];

const VALUE_PRESETS: Record<string, string[]> = {
  Size: ["S", "M", "L", "XL"],
  "Size (Run)": ["41", "42", "43", "41-43"],
};

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

export function ProductForm({ mode, productId }: ProductFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  const [categorySearch, setCategorySearch] = useState("");
  const [colorwaySearch, setColorwaySearch] = useState("");
  const [optionNameSearches, setOptionNameSearches] = useState<
    Record<number, string>
  >({});
  const isEditMode = mode === "edit";
  const cancelTarget = isEditMode ? `/products/${productId}` : "/products";

  const watchOptions = Form.useWatch("options", form);

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
    if (!product) return {};
    return {
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      colorId: product.colorId ?? undefined,
      badge: product.badge ?? undefined,
      productCategoryId: product.productCategoryId,
      unitId: product.unitId,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice ?? undefined,
      weightGram: product.weightGram ?? undefined,
      isActive: product.isActive,
      options: product.options?.map((opt) => ({
        name: opt.name,
        values: opt.values.map((v) => ({ id: v.id, value: v.value })),
      })),
      variants: product.variants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? undefined,
        isActive: v.isActive,
        isDefault: v.isDefault,
        optionValues: v.optionValues,
      })),
    };
  }, [product]);

  const isFormDirty = useCallback((): boolean => {
    if (isEditMode && product) {
      const currentValues = form.getFieldsValue();
      return (
        Object.keys(
          getDirtyFields(
            currentValues as FormValues & Record<string, unknown>,
            buildOriginalValues() as FormValues & Record<string, unknown>,
          ),
        ).length > 0
      );
    }
    return form.isFieldsTouched();
  }, [buildOriginalValues, form, isEditMode, product]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isFormDirty()) e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty]);

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

  // Variant Generation Logic
  useEffect(() => {
    if (!watchOptions || watchOptions.length === 0) {
      if (form.getFieldValue("variants")?.length > 0) {
        form.setFieldValue("variants", []);
      }
      return;
    }

    const allOptionsHaveValues = watchOptions.every(
      (opt) =>
        opt.name &&
        opt.values &&
        opt.values.length > 0 &&
        opt.values.every((val) => val.value && val.value.trim() !== ""),
    );

    if (!allOptionsHaveValues) return;

    const combinations = cartesianProduct(
      watchOptions.map((opt) =>
        opt.values.map((val) => ({
          optionName: opt.name,
          value: val.value,
          id: val.id,
        })),
      ),
    );

    const currentVariants = form.getFieldValue("variants") || [];
    const productName = form.getFieldValue("name") || "";
    const basePrice = form.getFieldValue("sellingPrice") || 0;

    const newVariants = combinations.map((combo, index) => {
      const variantName = combo.map((c) => c.value || "").join(" / ");
      const comboKey = combo
        .map((c) => `${c.optionName}:${c.value || ""}`)
        .join("|");

      const existing = currentVariants.find(
        (v: FormVariant) =>
          v.optionValues
            .map((ov) => `${ov.optionName}:${ov.value}`)
            .join("|") === comboKey,
      );

      if (existing) {
        return { ...existing, name: variantName };
      }

      return {
        name: variantName,
        sku: `${slugify(productName).toUpperCase()}-${combo
          .map((c) => (c.value || "").substring(0, 3).toUpperCase())
          .join("-")}`,
        price: basePrice,
        optionValues: combo.map((c) => ({
          optionName: c.optionName,
          value: c.value,
        })),
        tempOptionValueIds: combo
          .map((c) => c.id)
          .filter((id) => id?.startsWith("temp_")),
        isActive: true,
        isDefault: index === 0 && currentVariants.length === 0,
      };
    });

    form.setFieldValue("variants", newVariants);
  }, [watchOptions, form]);

  const createMutation = useMutation({
    mutationFn: (values: any) => productApi.create(values),
    onSuccess: () => {
      message.success("Produk berhasil dibuat");
      router.push("/products");
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => productApi.update(productId!, payload),
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
    mutationFn: (payload: { name: string; hexCode?: string }) =>
      colorApi.create(payload),
    onSuccess: (response) => {
      message.success(`Warna "${response.data.name}" berhasil dibuat`);
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      form.setFieldValue("colorId", response.data.id);
      setColorwaySearch("");
    },
    onError: handleError,
  });

  const handleCreateColor = (name: string) => {
    let hex = "#1677ff";
    modal.confirm({
      title: "Tambah Warna Baru",
      content: (
        <div className="pt-4">
          <Form layout="vertical">
            <Form.Item label="Nama Warna">
              <Input defaultValue={name} disabled />
            </Form.Item>
            <Form.Item
              label={COLOR_LABELS.hexCode}
              extra="Pilih warna atau masukkan kode hex di bawah ini"
            >
              <ColorPicker
                defaultValue={hex}
                showText
                onChangeComplete={(value) => {
                  hex = value.toHexString();
                }}
              />
            </Form.Item>
          </Form>
        </div>
      ),
      onOk: () => {
        createColorMutation.mutate({ name, hexCode: hex });
      },
      onCancel: () => {
        form.setFieldValue("colorId", undefined);
        setColorwaySearch("");
      },
    });
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    createCategoryMutation.isPending ||
    createColorMutation.isPending;

  function handleFinish(values: FormValues) {
    const payload = {
      ...values,
      options: values.options?.map((opt, optIdx) => ({
        name: opt.name,
        position: optIdx,
        values: opt.values.map((v, valIdx) => ({
          id: v.id,
          value: v.value,
          position: valIdx,
        })),
      })),
      variants: values.variants?.map((v) => ({
        sku: v.sku,
        name: v.name,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        isDefault: v.isDefault,
        isActive: v.isActive,
        tempOptionValueIds: v.tempOptionValueIds,
        // In edit mode, if we have optionValueIds from existing variants, they should be preserved if possible
        // But our backend replaces everything, so tempOptionValueIds is safer if we regenerated them.
      })),
    };

    if (!isEditMode) {
      createMutation.mutate(payload);
      return;
    }
    updateMutation.mutate(payload);
  }

  const categoryOptions = useMemo(() => {
    const options = (categoriesData?.data ?? []).map((c) => ({
      label: c.name,
      value: c.id,
    }));
    if (
      categorySearch &&
      !options.some(
        (opt) => opt.label.toLowerCase() === categorySearch.toLowerCase(),
      )
    ) {
      options.push({
        label: `+ Tambah "${categorySearch}"`,
        value: `CREATE_${categorySearch}`,
      });
    }
    return options;
  }, [categoriesData, categorySearch]);

  const colorOptions = useMemo(() => {
    const options = (colorsData?.data ?? []).map((c) => ({
      label: (
        <Space>
          {c.hexCode && (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: c.hexCode,
                border: "1px solid #d9d9d9",
              }}
            />
          )}
          <span>{c.name}</span>
        </Space>
      ),
      value: c.id,
      name: c.name,
    }));
    if (
      colorwaySearch &&
      !options.some(
        (opt) => opt.name.toLowerCase() === colorwaySearch.toLowerCase(),
      )
    ) {
      options.push({
        label: `+ Tambah "${colorwaySearch}"`,
        value: `CREATE_${colorwaySearch}`,
        name: colorwaySearch,
      } as any);
    }
    return options;
  }, [colorsData, colorwaySearch]);

  const unitOptions = (units ?? []).map((u) => ({
    label: `${u.name} (${u.abbreviation})`,
    value: u.id,
  }));

  const colorPresets = useMemo(() => {
    return (colorsData?.data ?? []).map((c) => c.name);
  }, [colorsData]);

  const getValuePresets = (optionName: string) => {
    if (optionName === "Warna") return colorPresets;
    return VALUE_PRESETS[optionName] || [];
  };

  const getOptionNameOptions = (index: number) => {
    const search = optionNameSearches[index];
    const options = [...PRESET_OPTIONS];
    if (
      search &&
      !options.some((opt) => opt.value.toLowerCase() === search.toLowerCase())
    ) {
      options.push({ label: `+ Tambah "${search}"`, value: search });
    }
    return options;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
            Kembali
          </Button>
          <div>
            <Typography.Title level={3} className="!mb-1">
              {isEditMode ? "Edit Produk" : "Tambah Produk"}
            </Typography.Title>
            <Typography.Text type="secondary">
              Lengkapi detail produk, harga, opsi, dan varian dalam satu
              halaman.
            </Typography.Text>
          </div>
        </Space>

        <Form.Item name="isActive" valuePropName="checked" className="!mb-0">
          <Switch checkedChildren="Aktif" unCheckedChildren="Non-aktif" />
        </Form.Item>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ isActive: true }}
        requiredMark="optional"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <main className="space-y-6">
            <Card
              title="Informasi Produk"
              extra={
                <Typography.Text type="secondary">Detail utama</Typography.Text>
              }
            >
              <div className="space-y-4">
                <Form.Item
                  name="name"
                  label={PRODUCT_LABELS.name}
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder="Contoh: Kaos Polos Cotton Combed"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={PRODUCT_LABELS.description}
                >
                  <Input.TextArea
                    rows={5}
                    placeholder="Tambahkan deskripsi singkat produk, bahan, atau catatan penting."
                  />
                </Form.Item>

                <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                  <Form.Item
                    name="productCategoryId"
                    label={PRODUCT_LABELS.productCategory}
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={categoryOptions}
                      placeholder="Pilih kategori"
                      showSearch
                      size="large"
                      onSearch={setCategorySearch}
                      onSelect={(v) => {
                        if (v.toString().startsWith("CREATE_")) {
                          createCategoryMutation.mutate(
                            v.toString().replace("CREATE_", ""),
                          );
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="unitId"
                    label={PRODUCT_LABELS.unit}
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={unitOptions}
                      placeholder="Pilih satuan"
                      size="large"
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                  <Form.Item name="colorId" label={PRODUCT_LABELS.color}>
                    <Select
                      showSearch
                      options={colorOptions}
                      size="large"
                      placeholder="Pilih warna"
                      onSearch={setColorwaySearch}
                      onSelect={(v) => {
                        if (v.toString().startsWith("CREATE_")) {
                          handleCreateColor(
                            v.toString().replace("CREATE_", ""),
                          );
                        }
                      }}
                      allowClear
                    />
                  </Form.Item>

                  <Form.Item name="badge" label={PRODUCT_LABELS.badge}>
                    <Select
                      allowClear
                      size="large"
                      placeholder="Pilih badge"
                      options={[
                        { label: "New Arrival", value: "New Arrival" },
                        { label: "Bestseller", value: "Bestseller" },
                      ]}
                    />
                  </Form.Item>
                </div>
              </div>
            </Card>

            <Card
              title="Harga & Berat"
              extra={
                <Typography.Text type="secondary">Pricing</Typography.Text>
              }
            >
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
                <Form.Item
                  name="sellingPrice"
                  label={PRODUCT_LABELS.sellingPrice}
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    className="w-full"
                    size="large"
                    prefix="Rp"
                    {...RUPIAH_FORMATTER}
                    min={0}
                  />
                </Form.Item>

                <Form.Item
                  name="purchasePrice"
                  label={PRODUCT_LABELS.purchasePrice}
                >
                  <InputNumber
                    className="w-full"
                    size="large"
                    prefix="Rp"
                    {...RUPIAH_FORMATTER}
                    min={0}
                  />
                </Form.Item>

                <Form.Item name="weightGram" label={PRODUCT_LABELS.weightGram}>
                  <InputNumber
                    className="w-full"
                    size="large"
                    suffix="gram"
                    min={0}
                  />
                </Form.Item>
              </div>
            </Card>

            <Card
              title="Daftar Varian"
              extra={
                <Typography.Text type="secondary">
                  {form.getFieldValue("variants")?.length ?? 0} varian
                </Typography.Text>
              }
            >
              <Form.List name="variants">
                {(fields) => (
                  <div className="space-y-3">
                    {fields.length === 0 && (
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <Typography.Text type="secondary" className="block">
                          Tambahkan opsi untuk menghasilkan varian secara
                          otomatis.
                        </Typography.Text>
                      </div>
                    )}

                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="rounded-lg border p-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(140px,1fr)_160px_180px_180px] lg:items-end">
                          <div className="min-w-0">
                            <Typography.Text
                              type="secondary"
                              className="block text-xs"
                            >
                              Varian
                            </Typography.Text>
                            <Typography.Text strong className="block truncate">
                              {form.getFieldValue(["variants", name, "name"])}
                            </Typography.Text>
                          </div>

                          <Form.Item
                            {...restField}
                            name={[name, "sku"]}
                            label="SKU"
                            rules={[{ required: true }]}
                            className="!mb-0"
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, "price"]}
                            label="Harga"
                            rules={[{ required: true }]}
                            className="!mb-0"
                          >
                            <InputNumber
                              className="w-full"
                              prefix="Rp"
                              {...RUPIAH_FORMATTER}
                            />
                          </Form.Item>

                          <div className="flex items-center justify-between gap-3 lg:justify-end lg:pb-1">
                            <Form.Item
                              {...restField}
                              name={[name, "isDefault"]}
                              valuePropName="checked"
                              className="!mb-0"
                            >
                              <Tag
                                color={
                                  form.getFieldValue([
                                    "variants",
                                    name,
                                    "isDefault",
                                  ])
                                    ? "blue"
                                    : "default"
                                }
                                className="cursor-pointer"
                                onClick={() => {
                                  const variants =
                                    form.getFieldValue("variants");
                                  variants.forEach(
                                    (v: any, i: number) =>
                                      (v.isDefault = i === name),
                                  );
                                  form.setFieldValue("variants", [...variants]);
                                }}
                              >
                                {form.getFieldValue([
                                  "variants",
                                  name,
                                  "isDefault",
                                ])
                                  ? "Default"
                                  : "Set Default"}
                              </Tag>
                            </Form.Item>

                            <Form.Item
                              {...restField}
                              name={[name, "isActive"]}
                              valuePropName="checked"
                              className="!mb-0"
                            >
                              <Switch
                                size="small"
                                checkedChildren="Aktif"
                                unCheckedChildren="Non-aktif"
                              />
                            </Form.Item>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Form.List>
            </Card>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card
              title="Opsi Varian"
              extra={
                <Typography.Text type="secondary">Opsional</Typography.Text>
              }
            >
              <Typography.Paragraph type="secondary" className="!mb-4">
                Buat opsi seperti warna atau ukuran. Kombinasi opsi akan
                otomatis menjadi varian.
              </Typography.Paragraph>

              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <Typography.Text strong>
                            Opsi {name + 1}
                          </Typography.Text>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        </div>

                        <Form.Item
                          {...restField}
                          name={[name, "name"]}
                          label="Nama Opsi"
                          rules={[{ required: true }]}
                          className="!mb-3"
                        >
                          <Select
                            showSearch
                            placeholder="Contoh: Ukuran, Warna"
                            options={getOptionNameOptions(name)}
                            onSearch={(val) =>
                              setOptionNameSearches((prev) => ({
                                ...prev,
                                [name]: val,
                              }))
                            }
                            onSelect={() =>
                              setOptionNameSearches((prev) => ({
                                ...prev,
                                [name]: "",
                              }))
                            }
                          />
                        </Form.Item>

                        <Form.List name={[name, "values"]}>
                          {(valFields, { add: addVal, remove: removeVal }) => (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {valFields.map(
                                  ({ key, name: valName, ...restField }) => (
                                    <Space
                                      key={key}
                                      align="center"
                                      className="rounded-md border px-2 py-1"
                                    >
                                      <Form.Item
                                        {...restField}
                                        name={[valName, "value"]}
                                        rules={[{ required: true }]}
                                        noStyle
                                      >
                                        <Input
                                          placeholder="Nilai"
                                          size="small"
                                          variant="borderless"
                                          style={{ width: 84 }}
                                        />
                                      </Form.Item>
                                      <Form.Item
                                        {...restField}
                                        name={[valName, "id"]}
                                        noStyle
                                      >
                                        <Input type="hidden" />
                                      </Form.Item>
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeVal(valName)}
                                        className="flex h-6 w-6 items-center justify-center"
                                      />
                                    </Space>
                                  ),
                                )}

                                <Button
                                  type="dashed"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() =>
                                    addVal({
                                      id: `temp_${Date.now()}_${Math.random()
                                        .toString(36)
                                        .substr(2, 5)}`,
                                    })
                                  }
                                >
                                  Nilai
                                </Button>
                              </div>

                              {watchOptions?.[name]?.name && (
                                <div className="flex flex-wrap gap-1 border-t pt-3">
                                  {getValuePresets(watchOptions[name].name).map(
                                    (preset) => {
                                      const isAdded = watchOptions[
                                        name
                                      ].values?.some((v) => v.value === preset);
                                      if (isAdded) return null;
                                      return (
                                        <Tag
                                          key={preset}
                                          className="cursor-pointer transition-colors"
                                          onClick={() =>
                                            addVal({
                                              value: preset,
                                              id: `temp_${Date.now()}_${Math.random()
                                                .toString(36)
                                                .substr(2, 5)}`,
                                            })
                                          }
                                        >
                                          + {preset}
                                        </Tag>
                                      );
                                    },
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Form.List>
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => add()}
                    >
                      Tambah Opsi
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Typography.Text type="secondary">
              {isEditMode
                ? "Simpan perubahan produk."
                : "Produk akan dibuat setelah disimpan."}
            </Typography.Text>
            <Space className="justify-end">
              <Button size="large" onClick={handleCancel}>
                Batal
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isPending}
              >
                {isEditMode ? "Perbarui Produk" : "Simpan Produk"}
              </Button>
            </Space>
          </div>
        </div>
      </Form>
    </div>
  );
}
