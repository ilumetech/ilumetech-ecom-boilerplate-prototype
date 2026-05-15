"use client";

import { useEffect } from "react";
import { App, Button, Form, Input, Modal } from "antd";
import { useMutation } from "@tanstack/react-query";
import type { Color } from "@ilumetech/types";
import { colorApi } from "@/lib/api/color";
import { COLOR_LABELS } from "@/lib/labels/color";
import { handleError } from "@/lib/utils/handle-error";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";

interface ColorFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  editTarget: Color | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
}

export function ColorFormModal({
  mode,
  open,
  editTarget,
  onClose,
  onSuccess,
}: ColorFormModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editTarget) {
      form.setFieldsValue({ name: editTarget.name });
      return;
    }
    form.resetFields();
  }, [open, isEditMode, editTarget, form]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => colorApi.create({ name: values.name }),
    onSuccess: () => {
      message.success("Warna berhasil dibuat");
      onSuccess();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<FormValues>) =>
      colorApi.update(editTarget!.id, payload),
    onSuccess: () => {
      message.success("Warna berhasil diperbarui");
      onSuccess();
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleFinish(values: FormValues) {
    if (!isEditMode) {
      createMutation.mutate(values);
      return;
    }

    const dirtyFields = getDirtyFields({ name: values.name }, { name: editTarget!.name });
    if (Object.keys(dirtyFields).length === 0) {
      message.info("Tidak ada perubahan");
      return;
    }
    updateMutation.mutate(dirtyFields);
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
      title={isEditMode ? "Edit Warna" : "Tambah Warna"}
      open={open}
      onCancel={handleCancelRequest}
      footer={footer}
      mask={{ closable: false }}
      destroyOnHidden={true}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="name"
          label={COLOR_LABELS.name}
          rules={[{ required: true, message: "Nama warna wajib diisi" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
