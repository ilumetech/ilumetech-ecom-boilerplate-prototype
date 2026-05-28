"use client";

import { App, Form, Input, InputNumber, Modal, Select } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  StockMovementType,
  StockReferenceType,
  StockVariant,
} from "@ilumetech/types";
import { stockApi } from "@/lib/api/stock";
import type { CreateStockMovementPayload } from "@/lib/api/stock";
import { STOCK_LABELS } from "@/lib/labels/stock";
import { handleError } from "@/lib/utils/handle-error";

interface StockMovementFormValues {
  type: StockMovementType;
  quantity: number;
  referenceType?: StockReferenceType;
  referenceId?: string;
  reason?: string;
  note?: string;
}

interface StockMovementFormModalProps {
  open: boolean;
  variant: StockVariant | null;
  onClose: () => void;
}

const MOVEMENT_TYPE_OPTIONS: Array<{
  label: string;
  value: StockMovementType;
}> = [
  { label: "Masuk", value: "IN" },
  { label: "Keluar", value: "OUT" },
  { label: "Penyesuaian", value: "ADJUSTMENT" },
];

const REFERENCE_TYPE_OPTIONS: Array<{
  label: string;
  value: StockReferenceType;
}> = [
  { label: "Manual", value: "MANUAL" },
  { label: "Order", value: "ORDER" },
  { label: "Retur", value: "RETURN" },
  { label: "Stock Opname", value: "STOCK_OPNAME" },
  { label: "Pembelian", value: "PURCHASE" },
];

export function StockMovementFormModal({
  open,
  variant,
  onClose,
}: StockMovementFormModalProps) {
  const [form] = Form.useForm<StockMovementFormValues>();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: CreateStockMovementPayload) => {
      if (!variant) throw new Error("Variant is required");
      return stockApi.createMovement(variant.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock", "variants"] });
      queryClient.invalidateQueries({ queryKey: ["stock", "movements"] });
      message.success("Mutasi stok berhasil disimpan");
      form.resetFields();
      onClose();
    },
    onError: handleError,
  });

  function handleCancel() {
    form.resetFields();
    onClose();
  }

  function handleSubmit(values: StockMovementFormValues) {
    mutation.mutate({
      type: values.type,
      quantity: values.quantity,
      referenceType: values.referenceType,
      referenceId: values.referenceId,
      reason: values.reason,
      note: values.note,
    });
  }

  return (
    <Modal
      title={`${STOCK_LABELS.addMovement}${variant ? ` - ${variant.sku}` : ""}`}
      open={open}
      okText="Simpan"
      cancelText="Batal"
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: "IN", referenceType: "MANUAL" }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="type"
          label={STOCK_LABELS.movementType}
          rules={[{ required: true, message: "Pilih tipe mutasi" }]}
        >
          <Select options={MOVEMENT_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="quantity"
          label={STOCK_LABELS.quantity}
          rules={[{ required: true, message: "Masukkan jumlah stok" }]}
        >
          <InputNumber min={0} precision={0} className="w-full" />
        </Form.Item>
        <Form.Item name="referenceType" label={STOCK_LABELS.referenceType}>
          <Select allowClear options={REFERENCE_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="referenceId" label={STOCK_LABELS.referenceId}>
          <Input />
        </Form.Item>
        <Form.Item name="reason" label={STOCK_LABELS.reason}>
          <Input />
        </Form.Item>
        <Form.Item name="note" label={STOCK_LABELS.note}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
