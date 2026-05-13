import { create } from 'zustand';
import type { AppUserMe } from '@ilumetech/types';

interface AuthState {
  currentUser: AppUserMe | null;
  permissions: string[];
  isLoading: boolean;
  setCurrentUser: (user: AppUserMe) => void;
  clearCurrentUser: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  permissions: [],
  isLoading: true,
  setCurrentUser: (user) =>
    set({ currentUser: user, permissions: user.permissions, isLoading: false }),
  clearCurrentUser: () =>
    set({ currentUser: null, permissions: [], isLoading: false }),
  hasPermission: (permission) => get().permissions.includes(permission),
}));
