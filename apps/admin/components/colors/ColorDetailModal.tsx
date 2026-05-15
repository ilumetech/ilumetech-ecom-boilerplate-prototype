"use client";

import { Button, Descriptions, Modal, Spin } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { Color } from "@ilumetech/types";
import { Can } from "@/components/auth/Can";
import { colorApi } from "@/lib/api/color";
import { COLOR_LABELS } from "@/lib/labels/color";

interface ColorDetailModalProps {
  colorId: string | null;
  onClose: () => void;
  onEditRequest: (color: Color) => void;
}

export function ColorDetailModal({
  colorId,
  onClose,
  onEditRequest,
}: ColorDetailModalProps) {
  const isOpen = colorId !== null;

  const { data: color, isLoading } = useQuery({
    queryKey: ["colors", "detail", colorId],
    queryFn: () => colorApi.getById(colorId!),
    enabled: isOpen,
  });

  function handleEditClick() {
    if (!color) return;
    onEditRequest(color);
  }

  const footer = [
    <Can key="edit" permission="color:update">
      <Button type="primary" icon={<EditOutlined />} onClick={handleEditClick} disabled={!color}>
        Edit
      </Button>
    </Can>,
  ];

  return (
    <Modal
      title="Detail Warna"
      open={isOpen}
      onCancel={onClose}
      footer={footer}
      destroyOnHidden={true}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )}
      {color && (
        <Descriptions column={1} bordered>
          <Descriptions.Item label={COLOR_LABELS.name}>{color.name}</Descriptions.Item>
          <Descriptions.Item label={COLOR_LABELS.createdAt}>
            {new Date(color.createdAt).toLocaleDateString("id-ID")}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
