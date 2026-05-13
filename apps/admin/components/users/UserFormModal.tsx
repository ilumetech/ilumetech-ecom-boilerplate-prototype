"use client";

import { useEffect } from "react";
import { App, Button, Form, Input, Modal, Select, Switch } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AppUser } from "@ilumetech/types";
import { userApi } from "@/lib/api/user";
import { USER_LABELS } from "@/lib/labels/user";
import { roleApi } from "@/lib/api/role";
import { handleError } from "@/lib/utils/handle-error";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";

interface UserFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  editTarget: AppUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  username: string;
  email?: string;
  password?: string;
  roleId: string;
  isActive: boolean;
}

export function UserFormModal({
  mode,
  open,
  editTarget,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEditMode = mode === "edit";

  const { data: roles } = useQuery({
    queryKey: ["roles", "list"],
    queryFn: roleApi.getRoles,
  });

  // Populate base fields when modal opens
  useEffect(() => {
    if (!open) return;
    if (isEditMode && editTarget) {
      form.setFieldsValue({
        username: editTarget.username ?? undefined,
        isActive: editTarget.isActive,
      });
      return;
    }
    form.resetFields();
    form.setFieldValue("isActive", true);
  }, [open, isEditMode, editTarget, form]);

  // Populate roleId once roles are loaded in edit mode
  useEffect(() => {
    if (!open || !isEditMode || !editTarget || !roles) return;
    const matchingRole = roles.find(
      (role) => role.name === editTarget.primaryRole,
    );
    if (!matchingRole) return;
    form.setFieldValue("roleId", matchingRole.id);
  }, [open, isEditMode, editTarget, roles, form]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      userApi.createUser({
        username: values.username,
        email: values.email!,
        password: values.password!,
        roleId: values.roleId,
      }),
    onSuccess: () => {
      message.success("Pengguna berhasil dibuat");
      onSuccess();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      userApi.updateUser(editTarget!.id, {
        username: values.username,
        roleId: values.roleId,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      message.success("Pengguna berhasil diperbarui");
      onSuccess();
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function buildOriginalValues(): Pick<
    FormValues,
    "username" | "roleId" | "isActive"
  > {
    const matchingRole = roles?.find(
      (role) => role.name === editTarget!.primaryRole,
    );
    return {
      username: editTarget!.username ?? "",
      roleId: matchingRole?.id ?? "",
      isActive: editTarget!.isActive,
    };
  }

  function handleFinish(values: FormValues) {
    if (isEditMode) {
      const dirtyFields = getDirtyFields(
        {
          username: values.username,
          roleId: values.roleId,
          isActive: values.isActive,
        },
        buildOriginalValues(),
      );
      if (Object.keys(dirtyFields).length === 0) {
        message.info("Tidak ada perubahan");
        return;
      }
      updateMutation.mutate(values);
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

  const roleOptions = (roles ?? []).map((role) => ({
    label: role.name,
    value: role.id,
  }));

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
      title={isEditMode ? "Edit Pengguna" : "Tambah Pengguna"}
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
          label={USER_LABELS.username}
          rules={[{ required: true, message: "Nama pengguna wajib diisi" }]}
        >
          <Input />
        </Form.Item>

        {!isEditMode && (
          <Form.Item
            name="email"
            label={USER_LABELS.email}
            rules={[
              {
                required: true,
                type: "email",
                message: "Format email tidak valid",
              },
            ]}
          >
            <Input />
          </Form.Item>
        )}

        {isEditMode && (
          <Form.Item label={USER_LABELS.email}>
            <Input value={editTarget?.email} disabled />
          </Form.Item>
        )}

        {!isEditMode && (
          <Form.Item
            name="password"
            label={USER_LABELS.password}
            rules={[
              {
                required: true,
                min: 8,
                message: "Password minimal 8 karakter",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
        )}

        <Form.Item
          name="roleId"
          label={USER_LABELS.role}
          rules={[{ required: true, message: "Role wajib dipilih" }]}
        >
          <Select options={roleOptions} placeholder="Pilih role" />
        </Form.Item>

        <Form.Item
          name="isActive"
          label={USER_LABELS.isActive}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
