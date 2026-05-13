"use client";

import { useEffect } from "react";
import { App, Button, Form, Input, Modal, Switch } from "antd";
import { useMutation } from "@tanstack/react-query";
import type { ProductCategory } from "@ilumetech/types";
import { productCategoryApi } from "@/lib/api/product-category";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels/product-category";
import { handleError } from "@/lib/utils/handle-error";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";

interface ProductCategoryFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  editTarget: ProductCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  description?: string;
  isActive: boolean;
}

export function ProductCategoryFormModal({
  mode,
  open,
  editTarget,
  onClose,
  onSuccess,
}: ProductCategoryFormModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editTarget) {
      form.setFieldsValue({
        name: editTarget.name,
        description: editTarget.description ?? undefined,
        isActive: editTarget.isActive,
      });
      return;
    }
    form.resetFields();
    form.setFieldValue("isActive", true);
  }, [open, isEditMode, editTarget, form]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      productCategoryApi.create({
        name: values.name,
        description: values.description,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      message.success("Kategori berhasil dibuat");
      onSuccess();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<FormValues>) =>
      productCategoryApi.update(editTarget!.id, payload),
    onSuccess: () => {
      message.success("Kategori berhasil diperbarui");
      onSuccess();
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function buildOriginalValues(): Pick<FormValues, "name" | "description" | "isActive"> {
    return {
      name: editTarget!.name,
      description: editTarget!.description ?? undefined,
      isActive: editTarget!.isActive,
    };
  }

  function handleFinish(values: FormValues) {
    if (isEditMode) {
      const dirtyFields = getDirtyFields(
        { name: values.name, description: values.description, isActive: values.isActive },
        buildOriginalValues(),
      );
      if (Object.keys(dirtyFields).length === 0) {
        message.info("Tidak ada perubahan");
        return;
      }
      updateMutation.mutate(dirtyFields);
      return;
    }
    createMutation.mutate(values);
  }

  function handleCancelRequest() {
    if (!form.isFieldsTouched()) {
      onClose();
      return;
    }
    modal.confirm({
      title: "Perubahan belum disimpan",
      content: "Apakah Anda yakin ingin menutup? Perubahan akan hilang.",
      okText: "Tutup",
      cancelText: "Kembali",
      onOk: onClose,
    });
  }

  const footer = [
    <Button key="cancel" onClick={handleCancelRequest}>
      Batal
    </Button>,
    <Button
      key="submit"
      type="primary"
      loading={isPending}
      onClick={() => form.submit()}
    >
      Simpan
    </Button>,
  ];

  return (
    <Modal
      title={isEditMode ? "Edit Kategori Produk" : "Tambah Kategori Produk"}
      open={open}
      onCancel={handleCancelRequest}
      footer={footer}
      mask={{ closable: false }}
      destroyOnHidden={true}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="name"
          label={PRODUCT_CATEGORY_LABELS.name}
          rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="description" label={PRODUCT_CATEGORY_LABELS.description}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="isActive"
          label={PRODUCT_CATEGORY_LABELS.isActive}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
