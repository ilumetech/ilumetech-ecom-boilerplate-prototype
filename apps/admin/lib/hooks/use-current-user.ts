'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user';
import { useAuthStore } from '@/stores/auth-store';

export function useCurrentUser() {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const clearCurrentUser = useAuthStore((state) => state.clearCurrentUser);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: userApi.getMe,
  });

  useEffect(() => {
    if (data) setCurrentUser(data);
  }, [data, setCurrentUser]);

  useEffect(() => {
    if (isError) clearCurrentUser();
  }, [isError, clearCurrentUser]);

  return { isLoading, isError };
}
