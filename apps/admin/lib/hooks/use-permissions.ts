"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";

interface UsePermissionsReturn {
  permissions: string[];
  hasPermission: (action: string) => boolean;
  isLoading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getMe,
  });

  const permissions = data?.permissions ?? [];

  const hasPermission = useCallback(
    (action: string): boolean => permissions.includes(action),
    [permissions],
  );

  return { permissions, hasPermission, isLoading };
}
