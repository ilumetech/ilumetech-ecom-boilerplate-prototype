"use client";

import { useEffect } from "react";
import { App, Button, Form, Input, Modal, Switch } from "antd";
import { useMutation } from "@tanstack/react-query";
import type { AppCustomer } from "@ilumetech/types";
import { customerApi } from "@/lib/api/customer";
import { CUSTOMER_LABELS } from "@/lib/labels/customer";
import { handleError } from "@/lib/utils/handle-error";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";

interface CustomerFormModalProps {
  open: boolean;
  editTarget: AppCustomer | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  username: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export function CustomerFormModal({
  open,
  editTarget,
  onClose,
  onSuccess,
}: CustomerFormModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      form.setFieldsValue({
        username: editTarget.username ?? undefined,
        firstName: editTarget.firstName ?? undefined,
        lastName: editTarget.lastName ?? undefined,
        isActive: editTarget.isActive,
      });
    } else {
      form.resetFields();
    }
  }, [open, editTarget, form]);

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      customerApi.updateCustomer(editTarget!.id, {
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      message.success("Pelanggan berhasil diperbarui");
      onSuccess();
    },
    onError: handleError,
  });

  const isPending = updateMutation.isPending;

  function buildOriginalValues(): FormValues {
    return {
      username: editTarget!.username ?? "",
      firstName: editTarget!.firstName ?? "",
      lastName: editTarget!.lastName ?? "",
      isActive: editTarget!.isActive,
    };
  }

  function handleFinish(values: FormValues) {
    if (!editTarget) return;

    const dirtyFields = getDirtyFields(
      {
        username: values.username || "",
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        isActive: values.isActive,
      } as any,
      buildOriginalValues() as any,
    );

    if (Object.keys(dirtyFields).length === 0) {
      message.info("Tidak ada perubahan");
      return;
    }

    updateMutation.mutate(values);
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
      title="Edit Pelanggan"
      open={open}
      onCancel={handleCancelRequest}
      footer={footer}
      mask={{ closable: false }}
      destroyOnHidden={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <Form.Item
          name="username"
          label={CUSTOMER_LABELS.username}
          rules={[{ required: true, message: "Nama pengguna wajib diisi" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="firstName"
          label={CUSTOMER_LABELS.firstName}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="lastName"
          label={CUSTOMER_LABELS.lastName}
        >
          <Input />
        </Form.Item>

        <Form.Item label={CUSTOMER_LABELS.email}>
          <Input value={editTarget?.email || ""} disabled />
        </Form.Item>

        <Form.Item
          name="isActive"
          label={CUSTOMER_LABELS.isActive}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
