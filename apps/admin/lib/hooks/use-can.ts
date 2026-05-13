'use client';

import { useAuthStore } from '@/stores/auth-store';

export function useCan(permission: string): boolean {
  return useAuthStore((state) => state.hasPermission(permission));
}
