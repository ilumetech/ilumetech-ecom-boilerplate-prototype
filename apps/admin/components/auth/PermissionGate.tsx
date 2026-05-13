'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
}

export function PermissionGate({ permission, children }: PermissionGateProps) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasPermission(permission)) {
      router.replace('/unauthorized');
    }
  }, [isLoading, hasPermission, permission, router]);

  if (isLoading || !hasPermission(permission)) return null;
  return <>{children}</>;
}
