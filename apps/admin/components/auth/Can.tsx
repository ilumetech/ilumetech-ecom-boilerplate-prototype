"use client";

import { useAuthStore } from "@/stores/auth-store";

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
