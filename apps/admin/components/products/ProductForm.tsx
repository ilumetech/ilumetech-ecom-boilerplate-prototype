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
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product";
import { productCategoryApi } from "@/lib/api/product-category";
import { colorApi } from "@/lib/api/color";
import { unitApi } from "@/lib/api/unit";
import { uploadApi } from "@/lib/api/upload";
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
  label: string;
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
  imageUrl?: string;
}

interface FormValues {
  name: string;
  slug?: string;
  description?: string;
  badge?: string;
  productCategoryId: string;
  unitId: string;
  sellingPrice: number;
  purchasePrice?: number;
  weightGram?: number;
  isActive: boolean;
  hasVariants?: boolean;
  options?: FormOption[];
  variants?: FormVariant[];
  images?: { url: string; alt?: string; sortOrder?: number }[];
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

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

interface DraggableUploadListItemProps {
  originNode: React.ReactElement;
  file: UploadFile;
  isFirst: boolean;
}

const DraggableUploadListItem = ({ originNode, file, isFirst }: DraggableUploadListItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.uid,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-50' : ''}
      {...attributes}
      {...listeners}
    >
      {isFirst && file.status === "done" && (
        <div className="absolute top-1 left-1 z-20">
          <Tag color="blue" className="m-0 text-[10px] font-bold uppercase shadow-sm">
            Utama
          </Tag>
        </div>
      )}
      {originNode}
    </div>
  );
};

function parseSizeRun(input: string): FormOptionValue[] {
  if (!input) return [];

  const parts = input
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: string[] = [];

  parts.forEach((part) => {
    if (part.includes("-")) {
      const rangeParts = part.split("-").map((s) => s.trim());

      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0]);
        const end = parseInt(rangeParts[1]);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            results.push(i.toString());
          }
          return;
        }
      }
    }

    results.push(part);
  });

  const uniqueResults = Array.from(new Set(results));

  return uniqueResults.map((v) => ({ label: v, value: v }));
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

  const [optionValueSearches, setOptionValueSearches] = useState<
    Record<number, string>
  >({});

  const [isPriceSchemeModalVisible, setIsPriceSchemeModalVisible] =
    useState(false);
  const [isPriceInputModalVisible, setIsPriceInputModalVisible] =
    useState(false);
  const [priceScheme, setPriceScheme] = useState<string | null>(null);
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({});
  const [colorPrices, setColorPrices] = useState<Record<string, number>>({});
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const oldIndex = fileList.findIndex((item) => item.uid === active.id);
      const newIndex = fileList.findIndex((item) => item.uid === over?.id);
      const newFileList = arrayMove(fileList, oldIndex, newIndex);
      
      setFileList(newFileList);
      
      // Update form values
      const images = newFileList
        .filter((file) => file.status === "done")
        .map((file, index) => ({
          url: file.url || (file.response as any)?.url,
          alt: file.name,
          sortOrder: index,
        }));
      
      form.setFieldValue("images", images);
    }
  };

  const handleUpload = async (options: any) => {
    const { onSuccess, onError, file } = options;

    try {
      const result = await uploadApi.uploadImage(file as File);
      onSuccess(result);
    } catch (err: any) {
      onError(err);
      message.error(`Upload gagal: ${err.message}`);
    }
  };

  const handleFileListChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    // Update form values
    const images = newFileList
      .filter((file) => file.status === "done")
      .map((file, index) => ({
        url: file.url || (file.response as any)?.url,
        alt: file.name,
        sortOrder: index,
      }));
    
    form.setFieldValue("images", images);
  };

  const handleVariantImageUpload = async (color: string, file: File) => {
    try {
      const result = await uploadApi.uploadImage(file);
      setVariantImages((prev) => ({
        ...prev,
        [color]: result.url,
      }));
      message.success(`Foto untuk warna ${color} berhasil diunggah`);
    } catch (err: any) {
      message.error(`Gagal mengunggah foto varian: ${err.message}`);
    }
  };


  const isEditMode = mode === "edit";
  const cancelTarget = isEditMode ? `/products/${productId}` : "/products";

  const watchOptions = Form.useWatch("options", form);
  const hasVariants = Form.useWatch("hasVariants", form);

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

  const { data: productsData } = useQuery({
    queryKey: ["products", "count"],
    queryFn: () => productApi.getAll({ limit: 1 }),
    enabled: !isEditMode,
  });

  useEffect(() => {
    if (isEditMode && product?.images) {
      const initialFileList = product.images.map((img) => ({
        uid: img.id,
        name: img.url.split("/").pop() || "image",
        status: "done" as const,
        url: img.url,
      }));
      setFileList(initialFileList);
      form.setFieldValue(
        "images",
        initialFileList.map((img, index) => ({
          url: img.url,
          alt: img.name,
          sortOrder: index,
        })),
      );
    }
  }, [isEditMode, product, form]);

  const buildOriginalValues = useCallback((): Partial<FormValues> => {
    if (!product) return {};

    return {
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      badge: product.badge ?? undefined,
      productCategoryId: product.productCategoryId,
      unitId: product.unitId,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice ?? undefined,
      weightGram: product.weightGram ?? undefined,
      isActive: product.isActive,
      hasVariants: product.options && product.options.length > 0,
      options: product.options?.map((opt) => ({
        name: opt.name,
        values: opt.values.map((v) => ({ label: v.value, value: v.id })),
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
      images: product.images?.map((img) => ({
        url: img.url,
        alt: img.alt ?? undefined,
        sortOrder: img.sortOrder,
      })),
    };
  }, [product]);

  useEffect(() => {
    if (isEditMode && product) {
      form.setFieldsValue(buildOriginalValues());
    }
  }, [isEditMode, product, form, buildOriginalValues]);

  useEffect(() => {
    if (isEditMode && product?.variants) {
      const images: Record<string, string> = {};
      product.variants.forEach((v) => {
        const colorVal = v.optionValues.find(
          (ov) => ov.optionName === "Warna",
        )?.value;
        if (colorVal && v.imageUrl) {
          images[colorVal] = v.imageUrl;
        }
      });
      setVariantImages(images);
    }
  }, [isEditMode, product]);

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

  useEffect(() => {
    if (!hasVariants || !watchOptions || watchOptions.length === 0) {
      if (form.getFieldValue("variants")?.length > 0) {
        form.setFieldValue("variants", []);
      }

      return;
    }

    const processedOptions = (watchOptions || []).map((opt) => {
      if (opt.name === "Size (Run)" && typeof opt.values === "string") {
        return {
          ...opt,
          values: parseSizeRun(opt.values),
        };
      }

      return opt;
    });

    const allOptionsHaveValues = processedOptions.every(
      (opt) =>
        opt &&
        opt.name &&
        opt.values &&
        opt.values.length > 0 &&
        opt.values.every(
          (val) =>
            val &&
            val.label &&
            typeof val.label === "string" &&
            val.label.trim() !== "",
        ),
    );

    if (!allOptionsHaveValues) return;

    if (!isEditMode && !productsData) return;

    const combinations = cartesianProduct(
      processedOptions.map((opt) =>
        opt.values.map((val) => ({
          optionName: opt.name,
          value: val.label,
          id: val.value,
        })),
      ),
    );

    const currentVariants = form.getFieldValue("variants") || [];
    const basePrice = form.getFieldValue("sellingPrice") || 0;

    const productIndex =
      isEditMode && product?.code
        ? parseInt(product.code.split("-")[1])
        : (productsData?.meta?.total ?? 0) + 1;

    const productPart = String(productIndex).padStart(4, "0");

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

      // Determine price based on scheme
      let variantPrice = basePrice;
      if (priceScheme === "by_size") {
        const sizeValue = combo.find(
          (c) => c.optionName === "Size" || c.optionName === "Size (Run)",
        )?.value;
        if (sizeValue && sizePrices[sizeValue]) {
          variantPrice = sizePrices[sizeValue];
        }
      } else if (priceScheme === "by_color") {
        const colorValue = combo.find((c) => c.optionName === "Warna")?.value;
        if (colorValue && colorPrices[colorValue]) {
          variantPrice = colorPrices[colorValue];
        }
      }

      if (existing) {
        return {
          ...existing,
          name: variantName,
          price:
            priceScheme === "by_size" || priceScheme === "by_color"
              ? variantPrice
              : existing.price,
          imageUrl:
            combo.find((c) => c.optionName === "Warna")?.value ?
            variantImages[combo.find((c) => c.optionName === "Warna")!.value] :
            existing.imageUrl,
        };
      }

      const variantPart = String(index + 1).padStart(4, "0");

      return {
        name: variantName,
        sku: `ILU-${productPart}-${variantPart}`,
        price: variantPrice,
        optionValues: combo.map((c) => ({
          optionName: c.optionName,
          value: c.value,
        })),
        tempOptionValueIds: combo
          .map((c) => c.id)
          .filter(
            (id) =>
              id?.startsWith("temp_") ||
              (!id?.includes("-") && id?.length !== 24 && id?.length !== 36),
          ),
        isActive: true,
        isDefault: index === 0 && currentVariants.length === 0,
        imageUrl:
          combo.find((c) => c.optionName === "Warna")?.value ?
          variantImages[combo.find((c) => c.optionName === "Warna")!.value] :
          undefined,
      };
    });

    form.setFieldValue("variants", newVariants);
    setSelectedRowKeys([]);
  }, [
    hasVariants,
    watchOptions,
    form,
    productsData,
    isEditMode,
    product,
    priceScheme,
    sizePrices,
    colorPrices,
    variantImages,
  ]);

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
    },
    onError: handleError,
  });

  const handleCreateColor = (name: string, onSuccess?: (color: any) => void) => {
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
        createColorMutation.mutate(
          { name, hexCode: hex },
          {
            onSuccess: (response) => {
              if (onSuccess) onSuccess(response.data);
            },
          },
        );
      },
      onCancel: () => {
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
    const { hasVariants, ...rest } = values;

    const payload = {
      ...rest,
      options: values.options?.map((opt, optIdx) => {
        const isSizeRun = opt.name === "Size (Run)";

        const rawValues = isSizeRun
          ? typeof opt.values === "string"
            ? parseSizeRun(opt.values)
            : opt.values
          : opt.values;

        return {
          name: opt.name,
          position: optIdx,
          values: rawValues.map((v, valIdx) => {
            const isExisting =
              v.value.includes("-") ||
              v.value.length === 24 ||
              v.value.length === 36;

            return {
              id: isExisting ? v.value : undefined,
              value: v.label,
              position: valIdx,
            };
          }),
        };
      }),
      variants: values.variants?.map((v, index) => {
        const currentVariant = form.getFieldValue(["variants", index]);
        return {
          sku: v.sku,
          name: v.name || currentVariant?.name || "",
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          isDefault: v.isDefault,
          isActive: v.isActive,
          imageUrl: v.imageUrl || currentVariant?.imageUrl,
          tempOptionValueIds: v.tempOptionValueIds || currentVariant?.tempOptionValueIds,
        };
      }),
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
      label: c.name,
      value: c.id,
      color: c.hexCode,
    }));

    if (
      colorwaySearch &&
      !options.some(
        (opt) => opt.label.toLowerCase() === colorwaySearch.toLowerCase(),
      )
    ) {
      options.push({
        label: `+ Tambah "${colorwaySearch}"`,
        value: `CREATE_${colorwaySearch}`,
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

  const getOptionNameOptions = (index: number) => {
    const search = optionNameSearches[index];

    const selectedNames = (watchOptions || [])
      .filter((_, i) => i !== index)
      .map((opt) => opt?.name);

    const hasWarna = selectedNames.includes("Warna");

    const hasSize =
      selectedNames.includes("Size") || selectedNames.includes("Size (Run)");

    const filteredPresets = PRESET_OPTIONS.filter((p) => {
      if (p.value === "Warna" && hasWarna) return false;
      if ((p.value === "Size" || p.value === "Size (Run)") && hasSize) {
        return false;
      }

      return true;
    });

    const options = [...filteredPresets];

    if (search) {
      const searchLower = search.toLowerCase();

      const alreadySelected = selectedNames.some(
        (n) => n?.toLowerCase() === searchLower,
      );

      const isPresetMatch = PRESET_OPTIONS.some(
        (p) => p.value.toLowerCase() === searchLower,
      );

      const isForbiddenPreset =
        (hasWarna && searchLower === "warna") ||
        (hasSize && (searchLower === "size" || searchLower === "size (run)"));

      if (!alreadySelected && !isPresetMatch && !isForbiddenPreset) {
        options.push({ label: `+ Tambah "${search}"`, value: search });
      }
    }

    return options;
  };

  const getValueOptions = (index: number) => {
    const optionName = form.getFieldValue(["options", index, "name"]);
    const search = optionValueSearches[index] || "";

    if (optionName === "Warna") {
      return colorOptions;
    }

    const presets = VALUE_PRESETS[optionName] || [];
    const options = presets.map((p) => ({ label: p, value: p }));

    if (
      search &&
      !options.some((opt) => opt.label.toLowerCase() === search.toLowerCase())
    ) {
      options.push({
        label: `+ Tambah "${search}"`,
        value: search,
      });
    }

    return options;
  };

  const sizes = useMemo(() => {
    const sizeOpt = (watchOptions || []).find(
      (opt) => opt.name === "Size" || opt.name === "Size (Run)",
    );
    if (!sizeOpt) return [];

    if (sizeOpt.name === "Size (Run)" && typeof sizeOpt.values === "string") {
      return parseSizeRun(sizeOpt.values);
    }
    return sizeOpt.values || [];
  }, [watchOptions]);

  const colors = useMemo(() => {
    const colorOpt = (watchOptions || []).find((opt) => opt.name === "Warna");
    if (!colorOpt) return [];
    return colorOpt.values || [];
  }, [watchOptions]);

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
        <div className="space-y-6">
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

                <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
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
              title="Media"
              extra={
                <Typography.Text type="secondary">Foto produk</Typography.Text>
              }
            >
              <Form.Item name="images" className="!mb-0">
                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                  <SortableContext items={fileList.map((i) => i.uid)} strategy={horizontalListSortingStrategy}>
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      customRequest={handleUpload}
                      onChange={handleFileListChange}
                      onPreview={handlePreview}
                      multiple={true}
                      maxCount={3}
                      itemRender={(originNode, file) => (
                        <DraggableUploadListItem 
                          originNode={originNode} 
                          file={file} 
                          isFirst={fileList[0]?.uid === file.uid}
                        />
                      )}
                    >
                      {fileList.length >= 3 ? null : (
                        <div className="flex flex-col items-center justify-center">
                          <PlusOutlined className="text-lg text-gray-400" />
                          <div className="mt-2 text-sm text-gray-500">Unggah</div>
                        </div>
                      )}
                    </Upload>
                  </SortableContext>
                </DndContext>
              </Form.Item>

              <div className="mt-4 rounded-xl bg-blue-50/50 p-4 border border-blue-100/50">
                <Typography.Text strong className="block mb-2 text-xs uppercase tracking-wider text-blue-600">
                  Persyaratan Foto
                </Typography.Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <Typography.Text type="secondary" className="text-xs">
                      Maksimal <strong>3 foto</strong> (drag untuk atur urutan)
                    </Typography.Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <Typography.Text type="secondary" className="text-xs">
                      Foto pertama akan menjadi <strong>Foto Utama</strong>
                    </Typography.Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <Typography.Text type="secondary" className="text-xs">
                      Format: <strong>JPG, PNG, atau WebP</strong>
                    </Typography.Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <Typography.Text type="secondary" className="text-xs">
                      Rasio <strong>1:1 (Persegi)</strong> disarankan
                    </Typography.Text>
                  </div>
                </div>
              </div>

              <Modal
                open={previewOpen}
                title="Preview Foto"
                footer={null}
                onCancel={() => setPreviewOpen(false)}
                centered
                styles={{ body: { padding: 0 } }}
              >
                <img alt="preview" className="w-full h-auto" src={previewImage} />
              </Modal>
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
                    style={{ width: "100%" }}
                    size="large"
                    prefix="Rp"
                    {...RUPIAH_FORMATTER}
                    min={0}
                    precision={0}
                    controls={false}
                    onKeyDown={(e) => {
                      if (
                        !/[0-9]/.test(e.key) &&
                        ![
                          "Backspace",
                          "Tab",
                          "Enter",
                          "Escape",
                          "ArrowLeft",
                          "ArrowRight",
                          "Delete",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="purchasePrice"
                  label={PRODUCT_LABELS.purchasePrice}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    prefix="Rp"
                    {...RUPIAH_FORMATTER}
                    min={0}
                    precision={0}
                    controls={false}
                    onKeyDown={(e) => {
                      if (
                        !/[0-9]/.test(e.key) &&
                        ![
                          "Backspace",
                          "Tab",
                          "Enter",
                          "Escape",
                          "ArrowLeft",
                          "ArrowRight",
                          "Delete",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item name="weightGram" label={PRODUCT_LABELS.weightGram}>
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    suffix="gram"
                    min={0}
                    precision={0}
                    controls={false}
                    onKeyDown={(e) => {
                      if (
                        !/[0-9]/.test(e.key) &&
                        ![
                          "Backspace",
                          "Tab",
                          "Enter",
                          "Escape",
                          "ArrowLeft",
                          "ArrowRight",
                          "Delete",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
              </div>
            </Card>

            <Card className="overflow-hidden" styles={{ body: { padding: 0 } }}>
              <div className="flex items-center justify-between p-6">
                <div>
                  <Typography.Text strong className="block">
                    Varian Produk
                  </Typography.Text>

                  <Typography.Text type="secondary" className="text-sm">
                    Apakah produk ini memiliki varian seperti warna atau ukuran?
                  </Typography.Text>
                </div>

                <Form.Item name="hasVariants" valuePropName="checked" noStyle>
                  <Switch
                    checkedChildren="Ya"
                    unCheckedChildren="Tidak"
                    onChange={(checked) => {
                      if (!checked) {
                        form.setFieldsValue({
                          options: [],
                          variants: [],
                        });
                        setPriceScheme(null);
                      } else {
                        setIsPriceSchemeModalVisible(true);
                      }
                    }}
                  />
                </Form.Item>
              </div>

              {hasVariants && (
                <div className="mt-2 border-t border-gray-100 p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <Typography.Text className="text-sm font-semibold text-gray-700">
                      Skema Harga Terpilih
                    </Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                      Harga varian akan diatur berdasarkan pilihan ini
                    </Typography.Text>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: "Semua Sama", value: "all_same" },
                      { label: "Berdasarkan Ukuran", value: "by_size" },
                      { label: "Berdasarkan Warna", value: "by_color" },
                      { label: "Berdasarkan Keduanya", value: "by_both" },
                    ].map((opt) => {
                      const isActive = priceScheme === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setPriceScheme(opt.value);
                            if (
                              opt.value === "all_same" &&
                              !form.getFieldValue("sellingPrice")
                            ) {
                              setIsPriceInputModalVisible(true);
                            }
                          }}
                          className={`h-11 rounded-xl px-5 text-sm font-medium transition-all ${
                            isActive
                              ? "border-2 border-blue-500 bg-blue-50 text-blue-600 shadow-sm"
                              : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {hasVariants && (
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
                        <div
                          key={key}
                          className="group relative rounded-xl border border-gray-200 bg-gray-50/30 p-5 transition-all hover:border-gray-300 hover:bg-gray-50/80"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                                {name + 1}
                              </div>
                              <Typography.Text className="text-sm font-semibold text-gray-700">
                                Konfigurasi Opsi
                              </Typography.Text>
                            </div>

                            <Button
                              type="text"
                              danger
                              size="small"
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Form.Item
                              {...restField}
                              name={[name, "name"]}
                              label="Nama Opsi"
                              rules={[{ required: true }]}
                              className="!mb-0"
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

                            <Form.Item
                              {...restField}
                              name={[name, "values"]}
                              label="Nilai Opsi"
                              rules={[{ required: true }]}
                              className="!mb-0"
                              {...(watchOptions?.[name]?.name === "Size (Run)"
                                ? {
                                    getValueProps: (val) => ({
                                      value: Array.isArray(val)
                                        ? val
                                            .map((v: any) => v.label)
                                            .join(", ")
                                        : val,
                                    }),
                                  }
                                : {})}
                            >
                              {watchOptions?.[name]?.name === "Size (Run)" ? (
                                <Input placeholder="Contoh: 41,42,43 atau 41-43" />
                              ) : (
                                <Select
                                  mode={
                                    watchOptions?.[name]?.name === "Warna"
                                      ? "multiple"
                                      : "tags"
                                  }
                                  placeholder="Pilih atau ketik nilai baru"
                                  options={getValueOptions(name)}
                                  labelInValue
                                  optionRender={(option) => (
                                    <Space>
                                      {option.data.color && (
                                        <div
                                          style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            backgroundColor: option.data.color,
                                            border: "1px solid #d9d9d9",
                                          }}
                                        />
                                      )}

                                      <span>{option.data.label}</span>
                                    </Space>
                                  )}
                                  onSearch={(val) => {
                                    setOptionValueSearches((prev) => ({
                                      ...prev,
                                      [name]: val,
                                    }));

                                    if (watchOptions?.[name]?.name === "Warna") {
                                      setColorwaySearch(val);
                                    }
                                  }}
                                  onSelect={(v: any) => {
                                    if (
                                      v.value
                                        ?.toString()
                                        .startsWith("CREATE_") ||
                                      (watchOptions?.[name]?.name === "Warna" &&
                                        !colorsData?.data.some(
                                          (c) => c.id === v.value,
                                        ))
                                    ) {
                                      const newName = v.label
                                        .toString()
                                        .replace("+ Tambah ", "")
                                        .replace(/"/g, "");

                                      const currentValues =
                                        form.getFieldValue([
                                          "options",
                                          name,
                                          "values",
                                        ]);

                                      form.setFieldValue(
                                        ["options", name, "values"],
                                        currentValues.filter(
                                          (cv: any) => cv.value !== v.value,
                                        ),
                                      );

                                      handleCreateColor(newName, (color) => {
                                        const updatedValues =
                                          form.getFieldValue([
                                            "options",
                                            name,
                                            "values",
                                          ]);

                                        form.setFieldValue(
                                          ["options", name, "values"],
                                          [
                                            ...updatedValues,
                                            {
                                              label: color.name,
                                              value: color.id,
                                            },
                                          ],
                                        );

                                        setOptionValueSearches((prev) => ({
                                          ...prev,
                                          [name]: "",
                                        }));

                                        setColorwaySearch("");
                                      });
                                    } else {
                                      setOptionValueSearches((prev) => ({
                                        ...prev,
                                        [name]: "",
                                      }));

                                      if (
                                        watchOptions?.[name]?.name === "Warna"
                                      ) {
                                        setColorwaySearch("");
                                      }
                                    }
                                  }}
                                />
                              )}
                            </Form.Item>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => add()}
                        disabled={fields.length >= 2}
                        className="h-12 rounded-xl border-gray-300 text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700"
                      >
                        Tambah Opsi Varian
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Card>
            )}

            {hasVariants && priceScheme === "by_size" && (
              <Card
                title="Harga per Ukuran"
                className="border-blue-100 bg-blue-50/10"
                extra={
                  <Typography.Text type="secondary">
                    Atur harga untuk setiap ukuran
                  </Typography.Text>
                }
              >
                {sizes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sizes.map((size) => (
                      <div
                        key={size.value}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Typography.Text strong className="text-gray-700">
                            {size.label}
                          </Typography.Text>
                          <Tag color="blue" className="mr-0">
                            Ukuran
                          </Tag>
                        </div>
                        <InputNumber
                          style={{ width: "100%" }}
                          prefix="Rp"
                          placeholder="Masukkan harga"
                          {...RUPIAH_FORMATTER}
                          value={sizePrices[size.label]}
                          onChange={(val) => {
                            setSizePrices((prev) => ({
                              ...prev,
                              [size.label]: val || 0,
                            }));
                          }}
                          min={0}
                          precision={0}
                          controls={false}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              ![
                                "Backspace",
                                "Tab",
                                "Enter",
                                "Escape",
                                "ArrowLeft",
                                "ArrowRight",
                                "Delete",
                              ].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Typography.Text type="secondary" className="max-w-xs">
                      Silakan tambahkan opsi <strong>Size</strong> atau{" "}
                      <strong>Size (Run)</strong> terlebih dahulu untuk mengatur
                      harga berdasarkan ukuran.
                    </Typography.Text>
                  </div>
                )}
              </Card>
            )}

            {hasVariants && priceScheme === "by_color" && (
              <Card
                title="Harga per Warna"
                className="border-blue-100 bg-blue-50/10"
                extra={
                  <Typography.Text type="secondary">
                    Atur harga untuk setiap warna
                  </Typography.Text>
                }
              >
                {colors.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {colors.map((color) => (
                      <div
                        key={color.value}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Typography.Text strong className="text-gray-700">
                            {color.label}
                          </Typography.Text>
                          <Tag color="blue" className="mr-0">
                            Warna
                          </Tag>
                        </div>
                        <InputNumber
                          style={{ width: "100%" }}
                          prefix="Rp"
                          placeholder="Masukkan harga"
                          {...RUPIAH_FORMATTER}
                          value={colorPrices[color.label]}
                          onChange={(val) => {
                            setColorPrices((prev) => ({
                              ...prev,
                              [color.label]: val || 0,
                            }));
                          }}
                          min={0}
                          precision={0}
                          controls={false}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              ![
                                "Backspace",
                                "Tab",
                                "Enter",
                                "Escape",
                                "ArrowLeft",
                                "ArrowRight",
                                "Delete",
                              ].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Typography.Text type="secondary" className="max-w-xs">
                      Silakan tambahkan opsi <strong>Warna</strong> terlebih
                      dahulu untuk mengatur harga berdasarkan warna.
                    </Typography.Text>
                  </div>
                )}
              </Card>
            )}
            
            {hasVariants && colors.length > 0 && (
              <Card
                title="Foto per Warna"
                className="border-blue-100 bg-blue-50/10"
                extra={
                  <Typography.Text type="secondary">
                    Unggah 1 foto untuk setiap warna
                  </Typography.Text>
                }
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {colors.map((color) => (
                    <div
                      key={color.value}
                      className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex w-full items-center justify-between">
                        <Typography.Text strong className="truncate text-gray-700">
                          {color.label}
                        </Typography.Text>
                        <Tag color="blue" className="mr-0">
                          Warna
                        </Tag>
                      </div>
                      
                      <Upload
                        listType="picture-card"
                        showUploadList={false}
                        customRequest={({ file }) => handleVariantImageUpload(color.label, file as File)}
                        className="variant-uploader"
                      >
                        {variantImages[color.label] ? (
                          <img
                            src={variantImages[color.label]}
                            alt={color.label}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <PlusOutlined />
                            <div className="mt-2 text-xs">Unggah</div>
                          </div>
                        )}
                      </Upload>
                      
                      {variantImages[color.label] && (
                        <Button 
                          type="text" 
                          danger 
                          size="small" 
                          onClick={() => setVariantImages(prev => {
                            const next = { ...prev };
                            delete next[color.label];
                            return next;
                          })}
                        >
                          Hapus Foto
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {hasVariants && (
              <Card
                title="Daftar Varian"
                extra={
                  <Typography.Text type="secondary">
                    {form.getFieldValue("variants")?.length ?? 0} varian
                  </Typography.Text>
                }
              >
                <div className="p-1">
                  {selectedRowKeys.length > 0 && (
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <Space size="middle">
                        <Typography.Text strong className="text-blue-600">
                          {selectedRowKeys.length} varian terpilih
                        </Typography.Text>
                        <div className="h-4 w-[1px] bg-blue-200" />
                        
                        <Space size="small">
                          <Button 
                            size="small" 
                            type="text" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              const basePrice = form.getFieldValue("sellingPrice") || 0;
                              modal.confirm({
                                title: "Terapkan Harga ke Semua yang Terpilih",
                                content: (
                                  <div className="pt-2">
                                    <Typography.Text type="secondary" className="block mb-3">
                                      Masukkan harga yang akan diterapkan ke {selectedRowKeys.length} varian terpilih.
                                    </Typography.Text>
                                    <InputNumber
                                      autoFocus
                                      style={{ width: "100%" }}
                                      size="large"
                                      prefix="Rp"
                                      {...RUPIAH_FORMATTER}
                                      defaultValue={basePrice}
                                      id="bulk-price-input"
                                      onKeyDown={(e) => {
                                        if (!/[0-9]/.test(e.key) && !["Backspace", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "Delete"].includes(e.key)) {
                                          e.preventDefault();
                                        }
                                      }}
                                    />
                                  </div>
                                ),
                                onOk: () => {
                                  const input = document.getElementById("bulk-price-input") as HTMLInputElement;
                                  const newPrice = Number(input.value.replace(/\./g, ""));
                                  const variants = form.getFieldValue("variants");
                                  const updatedVariants = variants.map((v: any, index: number) => {
                                    if (selectedRowKeys.includes(index)) {
                                      return { ...v, price: newPrice };
                                    }
                                    return v;
                                  });
                                  form.setFieldValue("variants", updatedVariants);
                                  message.success("Harga berhasil diterapkan");
                                }
                              });
                            }}
                          >
                            Terapkan Harga
                          </Button>

                          <Button 
                            size="small" 
                            type="text" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              const variants = form.getFieldValue("variants");
                              const updatedVariants = variants.map((v: any, index: number) => {
                                if (selectedRowKeys.includes(index)) {
                                  return { ...v, isActive: true };
                                }
                                return v;
                              });
                              form.setFieldValue("variants", updatedVariants);
                              message.success("Varian berhasil diaktifkan");
                            }}
                          >
                            Aktifkan
                          </Button>

                          <Button 
                            size="small" 
                            type="text" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              const variants = form.getFieldValue("variants");
                              const updatedVariants = variants.map((v: any, index: number) => {
                                if (selectedRowKeys.includes(index)) {
                                  return { ...v, isActive: false };
                                }
                                return v;
                              });
                              form.setFieldValue("variants", updatedVariants);
                              message.success("Varian berhasil dinonaktifkan");
                            }}
                          >
                            Non-aktifkan
                          </Button>

                        </Space>
                      </Space>
                      
                      <Button 
                        size="small" 
                        type="text" 
                        onClick={() => setSelectedRowKeys([])}
                      >
                        Batal
                      </Button>
                    </div>
                  )}

                  <Form.List name="variants">
                    {(fields) => {
                      const dataSource = fields.map((field, index) => ({
                        ...form.getFieldValue(["variants", index]),
                        key: index,
                        field,
                      }));

                      const columns = [
                        {
                          title: "Foto",
                          dataIndex: "imageUrl",
                          key: "imageUrl",
                          width: 70,
                          render: (url: string) => url ? (
                            <img src={url} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              -
                            </div>
                          )
                        },
                        {
                          title: "Varian",
                          dataIndex: "name",
                          key: "name",
                          render: (name: string, record: any) => (
                            <div className="flex flex-col">
                              <Form.Item name={[record.field.name, "name"]} noStyle>
                                <Input type="hidden" />
                              </Form.Item>
                              <Form.Item name={[record.field.name, "imageUrl"]} noStyle>
                                <Input type="hidden" />
                              </Form.Item>
                              <Typography.Text strong className="text-gray-800">
                                {name}
                              </Typography.Text>
                            </div>
                          )
                        },
                        {
                          title: "SKU",
                          dataIndex: "sku",
                          key: "sku",
                          width: 180,
                          render: (_: any, record: any) => (
                            <Form.Item
                              name={[record.field.name, "sku"]}
                              noStyle
                              rules={[{ required: true }]}
                            >
                              <Input size="middle" disabled />
                            </Form.Item>
                          )
                        },
                        {
                          title: "Harga",
                          dataIndex: "price",
                          key: "price",
                          width: 200,
                          render: (_: any, record: any) => (
                            <Form.Item
                              name={[record.field.name, "price"]}
                              noStyle
                              rules={[{ required: true }]}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                prefix="Rp"
                                size="middle"
                                {...RUPIAH_FORMATTER}
                                min={0}
                                precision={0}
                                controls={false}
                                disabled={
                                  priceScheme === "all_same" ||
                                  priceScheme === "by_size" ||
                                  priceScheme === "by_color"
                                }
                                onKeyDown={(e) => {
                                  if (!/[0-9]/.test(e.key) && !["Backspace", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "Delete"].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            </Form.Item>
                          )
                        },
                        {
                          title: "Default",
                          dataIndex: "isDefault",
                          key: "isDefault",
                          width: 90,
                          align: "center" as const,
                          render: (_: any, record: any) => (
                            <Radio
                              checked={form.getFieldValue(["variants", record.field.name, "isDefault"])}
                              onChange={() => {
                                const variants = form.getFieldValue("variants");
                                variants.forEach((v: any, i: number) => {
                                  v.isDefault = i === record.field.name;
                                });
                                form.setFieldValue("variants", [...variants]);
                              }}
                            />
                          )
                        },
                        {
                          title: "Status",
                          dataIndex: "isActive",
                          key: "isActive",
                          width: 100,
                          align: "center" as const,
                          render: (_: any, record: any) => (
                            <Form.Item
                              name={[record.field.name, "isActive"]}
                              valuePropName="checked"
                              noStyle
                            >
                              <Switch size="small" />
                            </Form.Item>
                          )
                        }
                      ];

                      return (
                        <Table
                          dataSource={dataSource}
                          columns={columns}
                          pagination={false}
                          rowSelection={{
                            selectedRowKeys,
                            onChange: (keys) => setSelectedRowKeys(keys),
                          }}
                          locale={{
                            emptyText: (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                  <PlusOutlined className="text-xl" />
                                </div>
                                <Typography.Text className="block font-medium text-gray-500">
                                  Belum Ada Varian
                                </Typography.Text>
                                <Typography.Text type="secondary" className="max-w-[240px] text-xs">
                                  Tambahkan opsi di atas untuk menghasilkan kombinasi varian secara otomatis.
                                </Typography.Text>
                              </div>
                            )
                          }}
                          className="variant-table"
                          rowClassName="group"
                        />
                      );
                    }}
                  </Form.List>
                </div>
              </Card>
            )}
          </main>
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Pilih Skema Harga</span>
          </div>
        }
        open={isPriceSchemeModalVisible}
        onCancel={() => {
          setIsPriceSchemeModalVisible(false);
          // If they cancel, we probably shouldn't have enabled variants
          // unless they already had them. But the user asked for a modal after select yes.
          // For now just close.
        }}
        footer={null}
        centered
        width={400}
        styles={{
          body: { paddingTop: "12px" },
        }}
      >
        <div className="flex flex-col gap-4">
          <Typography.Text type="secondary" className="mb-1 block px-1">
            Bagaimana Anda ingin mengatur harga untuk setiap varian yang akan
            dibuat?
          </Typography.Text>

          {[
            {
              label: "Semua Sama",
              value: "all_same",
              description: "Semua varian menggunakan harga yang sama.",
              icon: "💰",
            },
            {
              label: "Berdasarkan Ukuran",
              value: "by_size",
              description: "Harga berbeda untuk setiap ukuran.",
              icon: "📏",
            },
            {
              label: "Berdasarkan Warna",
              value: "by_color",
              description: "Harga berbeda untuk setiap warna.",
              icon: "🎨",
            },
            {
              label: "Berdasarkan Keduanya",
              value: "by_both",
              description: "Harga unik untuk setiap kombinasi warna & ukuran.",
              icon: "✨",
            },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className="group flex w-full items-center gap-4 rounded-2xl border-2 border-gray-100 bg-white p-5 text-left transition-all hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-md active:scale-[0.98]"
              onClick={() => {
                setPriceScheme(item.value);
                setIsPriceSchemeModalVisible(false);

                if (
                  item.value === "all_same" &&
                  !form.getFieldValue("sellingPrice")
                ) {
                  setIsPriceInputModalVisible(true);
                }
              }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl transition-colors group-hover:bg-blue-100">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <Typography.Text strong className="text-base">
                  {item.label}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-xs leading-relaxed">
                  {item.description}
                </Typography.Text>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Masukkan Harga Jual</span>
          </div>
        }
        open={isPriceInputModalVisible}
        onCancel={() => setIsPriceInputModalVisible(false)}
        footer={null}
        centered
        width={500}
        styles={{
          body: { paddingTop: "12px" },
        }}
      >
        <div className="flex flex-col gap-4">
          <Typography.Text type="secondary" className="mb-1 block px-1">
            Anda memilih skema harga <strong>Semua Sama</strong>. Silakan
            masukkan harga jual dasar untuk produk ini.
          </Typography.Text>

          <Form
            layout="vertical"
            onFinish={(values) => {
              form.setFieldValue("sellingPrice", values.sellingPrice);
              setIsPriceInputModalVisible(false);
            }}
          >
            <Form.Item
              name="sellingPrice"
              label={PRODUCT_LABELS.sellingPrice}
              rules={[{ required: true, message: "Harga jual wajib diisi" }]}
            >
              <InputNumber
                autoFocus
                style={{ width: "100%" }}
                size="large"
                prefix="Rp"
                {...RUPIAH_FORMATTER}
                min={0}
                precision={0}
                controls={false}
                keyboard={true}
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    ![
                      "Backspace",
                      "Tab",
                      "Enter",
                      "Escape",
                      "ArrowLeft",
                      "ArrowRight",
                      "Delete",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              className="mt-2"
            >
              Simpan Harga
            </Button>
          </Form>
        </div>
      </Modal>
    </div>
  );
}