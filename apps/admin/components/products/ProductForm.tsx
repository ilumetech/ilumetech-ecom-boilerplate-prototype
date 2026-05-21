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
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  finalPrice?: number;
  compareAtPrice?: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountMode?: DiscountMode | null;
  optionValues: { optionName: string; value: string }[];
  optionValueIds?: string[];
  tempOptionValueIds?: string[];
  isActive: boolean;
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
  finalPrice?: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountMode?: DiscountMode | null;
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

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
type DiscountMode = "AUTOMATIC" | "MANUAL";

function calculateDiscountedPrice(
  price: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (discountType === "PERCENTAGE") {
    return Math.max(0, Math.round(price - (price * discountValue) / 100));
  }

  return Math.max(0, price - discountValue);
}

const PRESET_OPTIONS = [
  { label: "Warna", value: "Warna" },
  { label: "Size", value: "Size" },
  { label: "Size (Run)", value: "Size (Run)" },
];

const VALUE_PRESETS: Record<string, string[]> = {
  Size: ["S", "M", "L", "XL"],
  "Size (Run)": ["41", "42", "43", "41-43"],
};

const DEFAULT_VARIANT_NAME = "Default";

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

function buildDefaultVariantSku(productPart: string): string {
  return `ILU-${productPart}-0001`;
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

const DraggableUploadListItem = ({
  originNode,
  file,
  isFirst,
}: DraggableUploadListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.uid,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: "move",
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "z-50" : ""}
      {...attributes}
      {...listeners}
    >
      {isFirst && file.status === "done" && (
        <div className="absolute top-1 left-1 z-20">
          <Tag
            color="blue"
            className="m-0 text-[10px] font-bold uppercase shadow-sm"
          >
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
      const startStr = rangeParts[0];
      const endStr = rangeParts[1];

      if (
        rangeParts.length === 2 &&
        startStr !== undefined &&
        endStr !== undefined
      ) {
        const start = parseInt(startStr);
        const end = parseInt(endStr);

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

interface SizeRunInputProps {
  value?: FormOptionValue[];
  onChange?: (val: FormOptionValue[]) => void;
  isEditMode: boolean;
  product?: any;
}

function SizeRunInput({
  value = [],
  onChange,
  isEditMode,
  product,
}: SizeRunInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const newParsed = parseSizeRun(trimmed);
    if (newParsed.length === 0) return;

    const existingLabels = new Set(
      value.map((v) => v.label.trim().toLowerCase()),
    );
    const uniqueNew = newParsed.filter(
      (v) => !existingLabels.has(v.label.trim().toLowerCase()),
    );

    if (uniqueNew.length > 0) {
      const nextValue = [...value, ...uniqueNew];
      onChange?.(nextValue);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd();
    }
  };

  const dbOption = product?.options?.find((o: any) => o.name === "Size (Run)");
  const savedValuesSet = new Set(
    dbOption?.values.map((v: any) => v.value.trim().toLowerCase()) || [],
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder="Masukkan ukuran baru (contoh: 46-50 atau 45) lalu tekan Enter"
        />
        <Button onClick={handleAdd} type="primary">
          Tambah
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((size) => {
            const isSaved =
              isEditMode && savedValuesSet.has(size.label.trim().toLowerCase());
            return (
              <div
                key={size.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-medium transition-all ${
                  isSaved
                    ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed select-none"
                    : "bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-100/50"
                }`}
                title={
                  isSaved
                    ? "Nilai opsi yang sudah disimpan tidak dapat dihapus untuk menjaga integritas data"
                    : undefined
                }
              >
                {isSaved && <span className="text-xs">🔒</span>}
                <span>{size.label}</span>
                {!isSaved && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextValue = value.filter(
                        (s) => s.label !== size.label,
                      );
                      onChange?.(nextValue);
                    }}
                    className="hover:text-blue-900 focus:outline-none font-bold text-xs ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
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
  const [variantImages, setVariantImages] = useState<Record<string, string>>(
    {},
  );
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

  const handleFileListChange: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
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
  const watchSellingPrice = Form.useWatch("sellingPrice", form);
  const watchFinalPrice = Form.useWatch("finalPrice", form);

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

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: () => productApi.getById(productId!),
    enabled: isEditMode,
  });

  const hasSavedOptions =
    isEditMode && product?.options && product.options.length > 0;

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
    const firstVariant = product.variants?.[0];

    return {
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      badge: product.badge ?? undefined,
      productCategoryId: product.productCategoryId,
      unitId: product.unitId,
      sellingPrice: product.sellingPrice,
      finalPrice: firstVariant?.finalPrice ?? product.sellingPrice,
      discountType: firstVariant?.discountType ?? undefined,
      discountValue: firstVariant?.discountValue ?? undefined,
      discountMode: firstVariant?.discountMode ?? undefined,
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
        finalPrice: v.finalPrice,
        compareAtPrice: v.compareAtPrice ?? undefined,
        discountType: v.discountType ?? undefined,
        discountValue: v.discountValue ?? undefined,
        discountMode: v.discountMode ?? undefined,
        isActive: v.isActive,
        optionValues: v.optionValues,
        optionValueIds: v.optionValues
          .map((ov) => {
            const opt = product.options?.find((o) => o.name === ov.optionName);
            const val = opt?.values?.find((val) => val.value === ov.value);
            return val?.id;
          })
          .filter((id): id is string => !!id),
        tempOptionValueIds: [],
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
      const sizePricesMap: Record<string, number> = {};
      const colorPricesMap: Record<string, number> = {};

      product.variants.forEach((v) => {
        const colorVal = v.optionValues.find(
          (ov) => ov.optionName === "Warna",
        )?.value;
        if (colorVal && v.imageUrl) {
          images[colorVal] = v.imageUrl;
        }

        const sizeVal = v.optionValues.find(
          (ov) => ov.optionName === "Size" || ov.optionName === "Size (Run)",
        )?.value;

        if (sizeVal) {
          sizePricesMap[sizeVal] = v.price;
        }
        if (colorVal) {
          colorPricesMap[colorVal] = v.price;
        }
      });

      setVariantImages(images);
      setSizePrices(sizePricesMap);
      setColorPrices(colorPricesMap);

      // Deduce price scheme
      const dbVariants = product?.variants;
      if (dbVariants && dbVariants.length > 0 && dbVariants[0]) {
        const firstPrice = dbVariants[0].price;
        const allPricesSame = dbVariants.every((v) => v.price === firstPrice);

        if (allPricesSame) {
          setPriceScheme("all_same");
        } else {
          const sizeGroups: Record<string, Set<number>> = {};
          const colorGroups: Record<string, Set<number>> = {};

          dbVariants.forEach((v) => {
            const sizeVal = v.optionValues.find(
              (ov) =>
                ov.optionName === "Size" || ov.optionName === "Size (Run)",
            )?.value;
            const colorVal = v.optionValues.find(
              (ov) => ov.optionName === "Warna",
            )?.value;

            if (sizeVal) {
              if (!sizeGroups[sizeVal]) sizeGroups[sizeVal] = new Set();
              sizeGroups[sizeVal].add(v.price);
            }
            if (colorVal) {
              if (!colorGroups[colorVal]) colorGroups[colorVal] = new Set();
              colorGroups[colorVal].add(v.price);
            }
          });

          const sizePricesUnique = Object.values(sizeGroups).every(
            (s) => s.size === 1,
          );
          const colorPricesUnique = Object.values(colorGroups).every(
            (s) => s.size === 1,
          );

          if (sizePricesUnique && !colorPricesUnique) {
            setPriceScheme("by_size");
          } else if (colorPricesUnique && !sizePricesUnique) {
            setPriceScheme("by_color");
          } else {
            setPriceScheme("by_both");
          }
        }
      }
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
    const basePrice = watchSellingPrice || 0;

    const productIndex =
      isEditMode && product?.code
        ? parseInt(product.code.split("-")[1] ?? "0")
        : (productsData?.meta?.total ?? 0) + 1;

    const productPart = String(productIndex).padStart(4, "0");

    const newVariants = combinations.map((combo, index) => {
      const variantName = combo.map((c) => c.value || "").join(" / ");

      const comboKey = combo
        .map((c) => `${c.optionName}:${c.value || ""}`)
        .join("|");

      const existing = currentVariants.find((v: FormVariant) => {
        if (!v.optionValues || v.optionValues.length !== combo.length)
          return false;
        return combo.every((c) =>
          v.optionValues.some(
            (ov) => ov.optionName === c.optionName && ov.value === c.value,
          ),
        );
      });

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
        const nextPrice =
          priceScheme === "by_both" ? existing.price : variantPrice;

        const nextDefaultFinalPrice =
          watchFinalPrice !== undefined && watchFinalPrice !== null
            ? Math.min(watchFinalPrice, nextPrice)
            : nextPrice;

        return {
          ...existing,
          name: variantName,
          price: nextPrice,
          finalPrice:
            existing.discountMode || existing.finalPrice !== existing.price
              ? Math.min(existing.finalPrice ?? nextPrice, nextPrice)
              : nextDefaultFinalPrice,
          imageUrl: combo.find((c) => c.optionName === "Warna")?.value
            ? variantImages[combo.find((c) => c.optionName === "Warna")!.value]
            : existing.imageUrl,
        };
      }

      const variantPart = String(index + 1).padStart(4, "0");

      const optionValueIds: string[] = [];
      const tempOptionValueIds: string[] = [];

      combo.forEach((c) => {
        const isDbId =
          c.id &&
          !c.id.startsWith("temp_") &&
          (c.id.includes("-") || c.id.length === 24 || c.id.length === 36);

        if (isDbId) {
          optionValueIds.push(c.id);
        } else if (c.id) {
          tempOptionValueIds.push(c.id);
        }
      });

      const nextDefaultFinalPrice =
        watchFinalPrice !== undefined && watchFinalPrice !== null
          ? Math.min(watchFinalPrice, variantPrice)
          : variantPrice;

      return {
        name: variantName,
        sku: `ILU-${productPart}-${variantPart}`,
        price: variantPrice,
        finalPrice: nextDefaultFinalPrice,
        optionValues: combo.map((c) => ({
          optionName: c.optionName,
          value: c.value,
        })),
        optionValueIds,
        tempOptionValueIds,
        isActive: true,
        imageUrl: combo.find((c) => c.optionName === "Warna")?.value
          ? variantImages[combo.find((c) => c.optionName === "Warna")!.value]
          : undefined,
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
    watchSellingPrice,
    watchFinalPrice,
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

  const handleCreateColor = (
    name: string,
    onSuccess?: (color: any) => void,
  ) => {
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
    const {
      hasVariants,
      finalPrice,
      discountType,
      discountValue,
      discountMode,
      ...rest
    } = values;
    const hasVariantOptions = Boolean(hasVariants && values.options?.length);
    const productIndex =
      isEditMode && product?.code
        ? parseInt(product.code.split("-")[1] ?? "0")
        : (productsData?.meta?.total ?? 0) + 1;
    const productPart = String(productIndex).padStart(4, "0");
    const currentDefaultVariant = values.variants?.[0];

    const defaultVariant = {
      sku:
        currentDefaultVariant?.sku &&
        !currentDefaultVariant.optionValues?.length
          ? currentDefaultVariant.sku
          : buildDefaultVariantSku(productPart),
      name: DEFAULT_VARIANT_NAME,
      price: values.sellingPrice,
      finalPrice: finalPrice ?? values.sellingPrice,
      compareAtPrice: currentDefaultVariant?.compareAtPrice,
      discountType,
      discountValue,
      discountMode,
      isActive: currentDefaultVariant?.isActive ?? true,
      imageUrl: currentDefaultVariant?.imageUrl,
      tempOptionValueIds: [],
    };

    const payload = {
      ...rest,
      options: hasVariantOptions
        ? values.options?.map((opt, optIdx) => {
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
          })
        : [],
      variants:
        hasVariantOptions && values.variants?.length
          ? values.variants.map((v, index) => {
              const currentVariant = form.getFieldValue(["variants", index]);
              return {
                sku: v.sku,
                name: v.name || currentVariant?.name || "",
                price: v.price,
                finalPrice: v.finalPrice ?? v.price,
                compareAtPrice: v.compareAtPrice,
                discountType: v.discountType,
                discountValue: v.discountValue,
                discountMode: v.discountMode,
                isActive: v.isActive,
                imageUrl: v.imageUrl || currentVariant?.imageUrl,
                optionValueIds:
                  v.optionValueIds || currentVariant?.optionValueIds || [],
                tempOptionValueIds:
                  v.tempOptionValueIds ||
                  currentVariant?.tempOptionValueIds ||
                  [],
              };
            })
          : [defaultVariant],
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

  const getSavedValueIds = useCallback(
    (index: number) => {
      if (!isEditMode || !product?.options) return new Set<string>();
      const optionName = form.getFieldValue(["options", index, "name"]);
      const dbOption = product.options.find((opt) => opt.name === optionName);
      if (!dbOption) return new Set<string>();
      return new Set(dbOption.values.map((v) => v.id));
    },
    [isEditMode, product, form],
  );

  const getSavedValueNames = useCallback(
    (index: number) => {
      if (!isEditMode || !product?.options) return new Set<string>();
      const optionName = form.getFieldValue(["options", index, "name"]);
      const dbOption = product.options.find((opt) => opt.name === optionName);
      if (!dbOption) return new Set<string>();
      return new Set(dbOption.values.map((v) => v.value.toLowerCase()));
    },
    [isEditMode, product, form],
  );

  const getValueOptions = (index: number) => {
    const optionName = form.getFieldValue(["options", index, "name"]);
    const search = optionValueSearches[index] || "";
    const savedIds = getSavedValueIds(index);
    const savedNames = getSavedValueNames(index);

    let list: {
      label: string;
      value: string;
      color?: string | null;
      disabled?: boolean;
    }[] = [];

    if (optionName === "Warna") {
      list = colorOptions.map((opt) => ({
        ...opt,
        disabled:
          savedIds.has(opt.value) || savedNames.has(opt.label.toLowerCase()),
      }));
    } else {
      const presets = VALUE_PRESETS[optionName] || [];
      list = presets.map((p) => ({ label: p, value: p }));

      const currentValues =
        form.getFieldValue(["options", index, "values"]) || [];
      if (Array.isArray(currentValues)) {
        currentValues.forEach((cv: any) => {
          if (cv && cv.value && !list.some((item) => item.value === cv.value)) {
            list.push({ label: cv.label, value: cv.value });
          }
        });
      }
    }

    if (
      search &&
      !list.some((opt) => opt.label.toLowerCase() === search.toLowerCase())
    ) {
      list.push({
        label: `+ Tambah "${search}"`,
        value: search,
      });
    }

    return list;
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

  if (isEditMode && isProductLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
        <Typography.Text type="secondary" className="animate-pulse">
          Memuat data produk...
        </Typography.Text>
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ isActive: true }}
      requiredMark="optional"
    >
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
                  <SortableContext
                    items={fileList.map((i) => i.uid)}
                    strategy={horizontalListSortingStrategy}
                  >
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
                          <div className="mt-2 text-sm text-gray-500">
                            Unggah
                          </div>
                        </div>
                      )}
                    </Upload>
                  </SortableContext>
                </DndContext>
              </Form.Item>

              <div className="mt-4 rounded-xl bg-blue-50/50 p-4 border border-blue-100/50">
                <Typography.Text
                  strong
                  className="block mb-2 text-xs uppercase tracking-wider text-blue-600"
                >
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
                <img
                  alt="preview"
                  className="w-full h-auto"
                  src={previewImage}
                />
              </Modal>
            </Card>

            <Card
              title="Harga & Berat"
              extra={
                <Typography.Text type="secondary">Pricing</Typography.Text>
              }
            >
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-4">
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
                    onChange={(value) => {
                      const nextPrice = value ?? 0;
                      const currentFinalPrice =
                        form.getFieldValue("finalPrice");
                      const currentDiscountMode =
                        form.getFieldValue("discountMode");
                      if (
                        !currentDiscountMode ||
                        currentFinalPrice === undefined
                      ) {
                        form.setFieldValue("finalPrice", nextPrice);
                      }
                    }}
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
                  name="finalPrice"
                  label={PRODUCT_LABELS.finalPrice}
                  dependencies={["sellingPrice"]}
                  rules={[
                    {
                      validator: (_, value) => {
                        const sellingPrice =
                          form.getFieldValue("sellingPrice") ?? 0;
                        if (value === undefined || value <= sellingPrice) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            "Harga setelah diskon tidak boleh lebih besar dari harga jual",
                          ),
                        );
                      },
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    prefix="Rp"
                    {...RUPIAH_FORMATTER}
                    min={0}
                    precision={0}
                    controls={false}
                    onChange={(value) => {
                      const sellingPrice =
                        form.getFieldValue("sellingPrice") ?? 0;
                      form.setFieldsValue({
                        discountMode:
                          typeof value === "number" && value < sellingPrice
                            ? "MANUAL"
                            : null,
                        discountType: null,
                        discountValue: null,
                      });
                    }}
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

              <Form.Item name="discountType" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="discountValue" hidden>
                <InputNumber />
              </Form.Item>
              <Form.Item name="discountMode" hidden>
                <Input />
              </Form.Item>

              {!hasVariants && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      let discountType: DiscountType = "PERCENTAGE";
                      let discountValue = 0;
                      modal.confirm({
                        title: "Terapkan Diskon Produk",
                        content: (
                          <Space
                            orientation="vertical"
                            className="w-full pt-2"
                            size="middle"
                          >
                            <Select
                              defaultValue={discountType}
                              options={[
                                { label: "Persentase", value: "PERCENTAGE" },
                                { label: "Nominal", value: "FIXED_AMOUNT" },
                              ]}
                              onChange={(value) => {
                                discountType = value;
                              }}
                              style={{ width: "100%" }}
                            />
                            <InputNumber
                              autoFocus
                              style={{ width: "100%" }}
                              placeholder="Masukkan nilai diskon"
                              {...RUPIAH_FORMATTER}
                              min={0}
                              precision={0}
                              controls={false}
                              onChange={(value) => {
                                discountValue = value ?? 0;
                              }}
                            />
                          </Space>
                        ),
                        onOk: () => {
                          const sellingPrice =
                            form.getFieldValue("sellingPrice") ?? 0;
                          const nextFinalPrice = calculateDiscountedPrice(
                            sellingPrice,
                            discountType,
                            discountValue,
                          );
                          form.setFieldsValue({
                            finalPrice: nextFinalPrice,
                            discountType,
                            discountValue,
                            discountMode: "AUTOMATIC",
                          });
                          message.success("Diskon produk berhasil diterapkan");
                        },
                      });
                    }}
                  >
                    Terapkan Diskon Otomatis
                  </Button>
                  <Button
                    onClick={() => {
                      const sellingPrice =
                        form.getFieldValue("sellingPrice") ?? 0;
                      form.setFieldsValue({
                        finalPrice: sellingPrice,
                        discountType: null,
                        discountValue: null,
                        discountMode: null,
                      });
                      message.success("Diskon produk dihapus");
                    }}
                  >
                    Hapus Diskon
                  </Button>
                </div>
              )}
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
                    disabled={hasSavedOptions}
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
                {hasSavedOptions && (
                  <div className="mb-6 rounded-xl bg-blue-50/50 p-4 border border-blue-100/50 flex items-start gap-3">
                    <Typography.Text className="text-blue-600 text-base">
                      ℹ️
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      className="text-xs leading-relaxed"
                    >
                      Struktur varian (nama opsi dan nilai opsi yang sudah
                      disimpan) telah dikunci untuk menjaga integritas pesanan
                      dan inventaris. Anda tetap dapat menambahkan nilai baru
                      (seperti ukuran atau warna baru), mengubah harga, SKU,
                      foto, dan status aktif untuk setiap varian.
                    </Typography.Text>
                  </div>
                )}

                <Typography.Paragraph type="secondary" className="!mb-4">
                  Buat opsi seperti warna atau ukuran. Kombinasi opsi akan
                  otomatis menjadi varian.
                </Typography.Paragraph>

                <Form.List name="options">
                  {(fields, { add, remove }) => (
                    <div className="space-y-4">
                      {fields.map(({ key, name, ...restField }) => {
                        const isExistingOption =
                          isEditMode &&
                          product?.options &&
                          name < product.options.length;
                        return (
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

                              {!isExistingOption && (
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  className="opacity-0 transition-opacity group-hover:opacity-100"
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(name)}
                                />
                              )}
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
                                  disabled={isExistingOption}
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
                                className="!mb-0"
                                {...(watchOptions?.[name]?.name === "Size (Run)"
                                  ? {
                                      rules: [
                                        {
                                          required: true,
                                          message: "Nilai opsi harus diisi",
                                        },
                                        {
                                          validator: (_, value) => {
                                            if (!isEditMode || !product) {
                                              return Promise.resolve();
                                            }
                                            const dbOption =
                                              product.options?.find(
                                                (o) => o.name === "Size (Run)",
                                              );
                                            if (!dbOption) {
                                              return Promise.resolve();
                                            }
                                            const currentArr = Array.isArray(
                                              value,
                                            )
                                              ? value
                                              : [];
                                            const currentLabels =
                                              currentArr.map((v: any) =>
                                                v.label.trim().toLowerCase(),
                                              );
                                            const missing = dbOption.values
                                              .map((v) => v.value.trim())
                                              .filter(
                                                (origLabel) =>
                                                  !currentLabels.includes(
                                                    origLabel.toLowerCase(),
                                                  ),
                                              );
                                            if (missing.length > 0) {
                                              return Promise.reject(
                                                new Error(
                                                  `Nilai opsi Size (Run) yang sudah disimpan tidak dapat dihapus: ${missing.join(
                                                    ", ",
                                                  )}`,
                                                ),
                                              );
                                            }
                                            return Promise.resolve();
                                          },
                                        },
                                      ],
                                    }
                                  : {
                                      rules: [
                                        {
                                          required: true,
                                          message: "Nilai opsi harus diisi",
                                        },
                                      ],
                                    })}
                              >
                                {watchOptions?.[name]?.name === "Size (Run)" ? (
                                  <SizeRunInput
                                    isEditMode={isEditMode}
                                    product={product}
                                  />
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
                                    onDeselect={(deselectedValue: any) => {
                                      const savedIds = getSavedValueIds(name);
                                      const valId = deselectedValue?.value;
                                      if (valId && savedIds.has(valId)) {
                                        message.warning(
                                          "Nilai opsi yang sudah disimpan tidak dapat dihapus untuk menjaga integritas data.",
                                        );
                                        const currentVals =
                                          form.getFieldValue([
                                            "options",
                                            name,
                                            "values",
                                          ]) || [];
                                        if (
                                          !currentVals.some(
                                            (cv: any) => cv.value === valId,
                                          )
                                        ) {
                                          form.setFieldValue(
                                            ["options", name, "values"],
                                            [...currentVals, deselectedValue],
                                          );
                                        }
                                      }
                                    }}
                                    optionRender={(option) => {
                                      const optData = option.data as any;
                                      return (
                                        <Space>
                                          {optData.color && (
                                            <div
                                              style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "50%",
                                                backgroundColor: optData.color,
                                                border: "1px solid #d9d9d9",
                                              }}
                                            />
                                          )}

                                          <span>{optData.label}</span>
                                        </Space>
                                      );
                                    }}
                                    onSearch={(val) => {
                                      setOptionValueSearches((prev) => ({
                                        ...prev,
                                        [name]: val,
                                      }));

                                      if (
                                        watchOptions?.[name]?.name === "Warna"
                                      ) {
                                        setColorwaySearch(val);
                                      }
                                    }}
                                    onSelect={(v: any) => {
                                      if (
                                        v.value
                                          ?.toString()
                                          .startsWith("CREATE_") ||
                                        (watchOptions?.[name]?.name ===
                                          "Warna" &&
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
                        );
                      })}

                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => add()}
                        disabled={fields.length >= 2 || hasSavedOptions}
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
                        <Typography.Text
                          strong
                          className="truncate text-gray-700"
                        >
                          {color.label}
                        </Typography.Text>
                        <Tag color="blue" className="mr-0">
                          Warna
                        </Tag>
                      </div>

                      <Upload
                        listType="picture-card"
                        showUploadList={false}
                        customRequest={({ file }) =>
                          handleVariantImageUpload(color.label, file as File)
                        }
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
                          onClick={() =>
                            setVariantImages((prev) => {
                              const next = { ...prev };
                              delete next[color.label];
                              return next;
                            })
                          }
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
                              const basePrice =
                                form.getFieldValue("sellingPrice") || 0;
                              modal.confirm({
                                title: "Terapkan Harga ke Semua yang Terpilih",
                                content: (
                                  <div className="pt-2">
                                    <Typography.Text
                                      type="secondary"
                                      className="block mb-3"
                                    >
                                      Masukkan harga yang akan diterapkan ke{" "}
                                      {selectedRowKeys.length} varian terpilih.
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
                                ),
                                onOk: () => {
                                  const input = document.getElementById(
                                    "bulk-price-input",
                                  ) as HTMLInputElement;
                                  const newPrice = Number(
                                    input.value.replace(/\./g, ""),
                                  );
                                  const variants =
                                    form.getFieldValue("variants");
                                  const updatedVariants = variants.map(
                                    (v: any, index: number) => {
                                      if (selectedRowKeys.includes(index)) {
                                        const hasDiscount = Boolean(
                                          v.discountMode,
                                        );
                                        return {
                                          ...v,
                                          price: newPrice,
                                          finalPrice: hasDiscount
                                            ? Math.min(
                                                v.finalPrice ?? newPrice,
                                                newPrice,
                                              )
                                            : newPrice,
                                        };
                                      }
                                      return v;
                                    },
                                  );
                                  form.setFieldValue(
                                    "variants",
                                    updatedVariants,
                                  );
                                  message.success("Harga berhasil diterapkan");
                                },
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
                              let discountType: DiscountType = "PERCENTAGE";
                              let discountValue = 0;
                              modal.confirm({
                                title: "Terapkan Diskon Otomatis",
                                content: (
                                  <Space
                                    orientation="vertical"
                                    className="w-full pt-2"
                                    size="middle"
                                  >
                                    <Typography.Text type="secondary">
                                      Diskon akan dihitung dari harga jual
                                      masing-masing varian terpilih.
                                    </Typography.Text>
                                    <Select
                                      defaultValue={discountType}
                                      options={[
                                        {
                                          label: "Persentase",
                                          value: "PERCENTAGE",
                                        },
                                        {
                                          label: "Nominal",
                                          value: "FIXED_AMOUNT",
                                        },
                                      ]}
                                      onChange={(value) => {
                                        discountType = value;
                                      }}
                                      style={{ width: "100%" }}
                                    />
                                    <InputNumber
                                      autoFocus
                                      style={{ width: "100%" }}
                                      placeholder="Masukkan nilai diskon"
                                      {...RUPIAH_FORMATTER}
                                      min={0}
                                      precision={0}
                                      controls={false}
                                      onChange={(value) => {
                                        discountValue = value ?? 0;
                                      }}
                                    />
                                  </Space>
                                ),
                                onOk: () => {
                                  const variants =
                                    form.getFieldValue("variants");
                                  const updatedVariants = variants.map(
                                    (v: FormVariant, index: number) => {
                                      if (!selectedRowKeys.includes(index))
                                        return v;
                                      return {
                                        ...v,
                                        finalPrice: calculateDiscountedPrice(
                                          v.price,
                                          discountType,
                                          discountValue,
                                        ),
                                        discountType,
                                        discountValue,
                                        discountMode: "AUTOMATIC" as const,
                                      };
                                    },
                                  );
                                  form.setFieldValue(
                                    "variants",
                                    updatedVariants,
                                  );
                                  message.success(
                                    "Diskon otomatis berhasil diterapkan",
                                  );
                                },
                              });
                            }}
                          >
                            Diskon Otomatis
                          </Button>

                          <Button
                            size="small"
                            type="text"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              const variants = form.getFieldValue("variants");
                              const updatedVariants = variants.map(
                                (v: FormVariant, index: number) => {
                                  if (!selectedRowKeys.includes(index))
                                    return v;
                                  return {
                                    ...v,
                                    finalPrice: v.finalPrice ?? v.price,
                                    discountType: null,
                                    discountValue: null,
                                    discountMode: "MANUAL" as const,
                                  };
                                },
                              );
                              form.setFieldValue("variants", updatedVariants);
                              message.success(
                                "Silakan isi harga setelah diskon secara manual",
                              );
                            }}
                          >
                            Input Manual
                          </Button>

                          <Button
                            size="small"
                            type="text"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              const variants = form.getFieldValue("variants");
                              const updatedVariants = variants.map(
                                (v: FormVariant, index: number) => {
                                  if (!selectedRowKeys.includes(index))
                                    return v;
                                  return {
                                    ...v,
                                    finalPrice: v.price,
                                    discountType: null,
                                    discountValue: null,
                                    discountMode: null,
                                  };
                                },
                              );
                              form.setFieldValue("variants", updatedVariants);
                              message.success("Diskon berhasil dihapus");
                            }}
                          >
                            Hapus Diskon
                          </Button>

                          <Button
                            size="small"
                            type="text"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              const variants = form.getFieldValue("variants");
                              const updatedVariants = variants.map(
                                (v: any, index: number) => {
                                  if (selectedRowKeys.includes(index)) {
                                    return { ...v, isActive: true };
                                  }
                                  return v;
                                },
                              );
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
                              const updatedVariants = variants.map(
                                (v: any, index: number) => {
                                  if (selectedRowKeys.includes(index)) {
                                    return { ...v, isActive: false };
                                  }
                                  return v;
                                },
                              );
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
                          render: (url: string) =>
                            url ? (
                              <img
                                src={url}
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                -
                              </div>
                            ),
                        },
                        {
                          title: "Varian",
                          dataIndex: "name",
                          key: "name",
                          render: (name: string, record: any) => (
                            <div className="flex flex-col">
                              <Form.Item
                                name={[record.field.name, "name"]}
                                noStyle
                              >
                                <Input type="hidden" />
                              </Form.Item>
                              <Form.Item
                                name={[record.field.name, "imageUrl"]}
                                noStyle
                              >
                                <Input type="hidden" />
                              </Form.Item>
                              <Typography.Text strong className="text-gray-800">
                                {name}
                              </Typography.Text>
                            </div>
                          ),
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
                          ),
                        },
                        {
                          title: "Harga",
                          dataIndex: "price",
                          key: "price",
                          width: 170,
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
                          ),
                        },
                        {
                          title: "Harga Setelah Diskon",
                          dataIndex: "finalPrice",
                          key: "finalPrice",
                          width: 190,
                          render: (_: any, record: any) => (
                            <>
                              <Form.Item
                                name={[record.field.name, "discountType"]}
                                hidden
                              >
                                <Input type="hidden" />
                              </Form.Item>
                              <Form.Item
                                name={[record.field.name, "discountValue"]}
                                hidden
                              >
                                <InputNumber />
                              </Form.Item>
                              <Form.Item
                                name={[record.field.name, "discountMode"]}
                                hidden
                              >
                                <Input type="hidden" />
                              </Form.Item>
                              <Form.Item
                                name={[record.field.name, "finalPrice"]}
                                noStyle
                                rules={[
                                  { required: true },
                                  {
                                    validator: (_, value) => {
                                      const price =
                                        form.getFieldValue([
                                          "variants",
                                          record.field.name,
                                          "price",
                                        ]) ?? 0;
                                      if (
                                        value === undefined ||
                                        value <= price
                                      ) {
                                        return Promise.resolve();
                                      }
                                      return Promise.reject(
                                        new Error(
                                          "Harga setelah diskon tidak boleh lebih besar dari harga",
                                        ),
                                      );
                                    },
                                  },
                                ]}
                              >
                                <InputNumber
                                  style={{ width: "100%" }}
                                  prefix="Rp"
                                  size="middle"
                                  {...RUPIAH_FORMATTER}
                                  min={0}
                                  precision={0}
                                  controls={false}
                                  onChange={(value) => {
                                    const price =
                                      form.getFieldValue([
                                        "variants",
                                        record.field.name,
                                        "price",
                                      ]) ?? 0;
                                    if (
                                      typeof value === "number" &&
                                      value < price
                                    ) {
                                      form.setFieldValue(
                                        [
                                          "variants",
                                          record.field.name,
                                          "discountMode",
                                        ],
                                        "MANUAL",
                                      );
                                      form.setFieldValue(
                                        [
                                          "variants",
                                          record.field.name,
                                          "discountType",
                                        ],
                                        null,
                                      );
                                      form.setFieldValue(
                                        [
                                          "variants",
                                          record.field.name,
                                          "discountValue",
                                        ],
                                        null,
                                      );
                                    }
                                  }}
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
                            </>
                          ),
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
                          ),
                        },
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
                                <Typography.Text
                                  type="secondary"
                                  className="max-w-[240px] text-xs"
                                >
                                  Tambahkan opsi di atas untuk menghasilkan
                                  kombinasi varian secara otomatis.
                                </Typography.Text>
                              </div>
                            ),
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
                description:
                  "Harga unik untuk setiap kombinasi warna & ukuran.",
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
                  <Typography.Text
                    type="secondary"
                    className="text-xs leading-relaxed"
                  >
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
    </Form>
  );
}
