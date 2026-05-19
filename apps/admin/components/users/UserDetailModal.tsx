"use client";

import { Button, Descriptions, Modal, Spin, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { AppUser } from "@ilumetech/types";
import { userApi } from "@/lib/api/user";
import { USER_LABELS } from "@/lib/labels/user";

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
  onEditRequest: (user: AppUser) => void;
}

export function UserDetailModal({
  userId,
  onClose,
  onEditRequest,
}: UserDetailModalProps) {
  const isOpen = userId !== null;

  const { data: user, isLoading } = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => userApi.getUser(userId!),
    enabled: isOpen,
  });

  function handleEditClick() {
    if (!user) return;
    onEditRequest(user);
  }

  const footer = [
    <Button key="close" onClick={onClose}>
      Tutup
    </Button>,
    <Button
      key="edit"
      type="primary"
      onClick={handleEditClick}
      disabled={!user}
    >
      Edit
    </Button>,
  ];

  return (
    <Modal
      title="Detail Pengguna"
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
      {user && <UserDescriptions user={user} />}
    </Modal>
  );
}

function UserDescriptions({ user }: { user: AppUser }) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const displayName = user.username ?? fullName ?? "—";

  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label={USER_LABELS.username}>
        {displayName}
      </Descriptions.Item>
      <Descriptions.Item label={USER_LABELS.email}>
        {user.email || "—"}
      </Descriptions.Item>
      <Descriptions.Item label={USER_LABELS.role}>
        {user.primaryRole ?? "—"}
      </Descriptions.Item>
      <Descriptions.Item label={USER_LABELS.status}>
        {user.isActive ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label={USER_LABELS.createdAt}>
        {new Date(user.createdAt).toLocaleDateString("id-ID")}
      </Descriptions.Item>
    </Descriptions>
  );
}
