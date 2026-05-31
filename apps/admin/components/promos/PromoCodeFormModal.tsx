"use client";

import { useEffect } from "react";
import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useMutation } from "@tanstack/react-query";
import type { PromoCode } from "@ilumetech/types";
import { promoCodeApi } from "@/lib/api/promo-code";
import { PROMO_CODE_LABELS } from "@/lib/labels/promo-code";
import { handleError } from "@/lib/utils/handle-error";
import { getDirtyFields } from "@/lib/utils/get-dirty-fields";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface PromoCodeFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  editTarget: PromoCode | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  activePeriod?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  isActive?: boolean;
}

const RUPIAH_FORMATTER = {
  formatter: (value: number | undefined) =>
    value !== undefined ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "",
  parser: (value: string | undefined) => Number(value?.replace(/\./g, "") ?? 0),
};

export function PromoCodeFormModal({
  mode,
  open,
  editTarget,
  onClose,
  onSuccess,
}: PromoCodeFormModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEditMode = mode === "edit";
  const watchDiscountType = Form.useWatch("discountType", form);

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editTarget) {
      form.setFieldsValue({
        code: editTarget.code,
        description: editTarget.description ?? undefined,
        discountType: editTarget.discountType,
        discountValue: editTarget.discountValue,
        minOrderAmount: editTarget.minOrderAmount,
        maxDiscount: editTarget.maxDiscount ?? undefined,
        usageLimit: editTarget.usageLimit ?? undefined,
        activePeriod: [
          dayjs(editTarget.startDate),
          editTarget.endDate ? dayjs(editTarget.endDate) : null,
        ],
        isActive: editTarget.isActive,
      });
      return;
    }
    form.resetFields();
    form.setFieldsValue({
      discountType: "PERCENTAGE",
      discountValue: 0,
      minOrderAmount: 0,
      isActive: true,
      activePeriod: [dayjs(), dayjs().add(1, "month")],
    });
  }, [open, isEditMode, editTarget, form]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => promoCodeApi.create(payload),
    onSuccess: () => {
      message.success("Kode promo berhasil dibuat");
      onSuccess();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => promoCodeApi.update(editTarget!.id, payload),
    onSuccess: () => {
      message.success("Kode promo berhasil diperbarui");
      onSuccess();
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleFinish(values: FormValues) {
    const [start, end] = values.activePeriod || [];

    const newSerialized = {
      code: values.code.trim().toUpperCase(),
      description: values.description || null,
      discountType: values.discountType,
      discountValue: values.discountValue,
      minOrderAmount: values.minOrderAmount ?? 0,
      maxDiscount: values.maxDiscount || null,
      usageLimit: values.usageLimit || null,
      startDate: start ? start.toISOString() : dayjs().toISOString(),
      endDate: end ? end.toISOString() : null,
      isActive: values.isActive ?? true,
    };

    if (!isEditMode) {
      createMutation.mutate(newSerialized);
      return;
    }

    const originalSerialized = {
      code: editTarget!.code,
      description: editTarget!.description,
      discountType: editTarget!.discountType,
      discountValue: editTarget!.discountValue,
      minOrderAmount: editTarget!.minOrderAmount,
      maxDiscount: editTarget!.maxDiscount,
      usageLimit: editTarget!.usageLimit,
      startDate: editTarget!.startDate,
      endDate: editTarget!.endDate,
      isActive: editTarget!.isActive,
    };

    const dirtyFields = getDirtyFields(newSerialized, originalSerialized);

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
      title={isEditMode ? "Edit Kode Promo" : "Tambah Kode Promo"}
      open={open}
      onCancel={handleCancelRequest}
      footer={footer}
      mask={{ closable: false }}
      destroyOnHidden={true}
      width={550}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <Form.Item
          name="code"
          label={PROMO_CODE_LABELS.code}
          rules={[
            { required: true, message: "Kode promo wajib diisi" },
            {
              pattern: /^[a-zA-Z0-9_\-]+$/,
              message: "Kode hanya boleh huruf, angka, dash, dan underscore",
            },
          ]}
          extra="Disimpan dalam huruf besar (e.g. PROMO50)"
        >
          <Input placeholder="e.g. PROMO50" />
        </Form.Item>

        <Form.Item name="description" label={PROMO_CODE_LABELS.description}>
          <Input.TextArea rows={2} placeholder="Penjelasan singkat mengenai promo ini..." />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="discountType"
            label={PROMO_CODE_LABELS.discountType}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "Persentase (%)", value: "PERCENTAGE" },
                { label: "Nominal (Rp)", value: "FIXED_AMOUNT" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="discountValue"
            label={PROMO_CODE_LABELS.discountValue}
            rules={[
              { required: true, message: "Nilai diskon wajib diisi" },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null) return Promise.resolve();
                  if (watchDiscountType === "PERCENTAGE" && value > 100) {
                    return Promise.reject(new Error("Nilai persentase tidak boleh lebih dari 100"));
                  }
                  if (value < 0) {
                    return Promise.reject(new Error("Nilai diskon tidak boleh negatif"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            {watchDiscountType === "PERCENTAGE" ? (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={100}
                addonAfter="%"
                placeholder="e.g. 10"
              />
            ) : (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                prefix="Rp"
                {...RUPIAH_FORMATTER}
                controls={false}
                placeholder="e.g. 50.000"
              />
            )}
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="minOrderAmount" label={PROMO_CODE_LABELS.minOrderAmount}>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              prefix="Rp"
              {...RUPIAH_FORMATTER}
              controls={false}
              placeholder="e.g. 100.000"
            />
          </Form.Item>

          <Form.Item
            name="maxDiscount"
            label={PROMO_CODE_LABELS.maxDiscount}
            tooltip="Batasan diskon maksimal untuk diskon bertipe persentase"
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              prefix="Rp"
              {...RUPIAH_FORMATTER}
              controls={false}
              placeholder="e.g. 50.000"
              disabled={watchDiscountType === "FIXED_AMOUNT"}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="usageLimit" label={PROMO_CODE_LABELS.usageLimit}>
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              precision={0}
              placeholder="Kosongkan jika tidak terbatas"
            />
          </Form.Item>

          <Form.Item name="isActive" label={PROMO_CODE_LABELS.isActive} valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Non-aktif" />
          </Form.Item>
        </div>

        <Form.Item
          name="activePeriod"
          label="Masa Berlaku Promo"
          rules={[{ required: true, message: "Masa berlaku promo wajib dipilih" }]}
        >
          <RangePicker style={{ width: "100%" }} showTime format="YYYY-MM-DD HH:mm" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
