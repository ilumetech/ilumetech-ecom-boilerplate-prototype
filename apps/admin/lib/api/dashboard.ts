import { apiClient } from './client';
import type { ApiResponse } from '@ilumetech/types';

export interface UserStats {
  active: number;
  inactive: number;
  total: number;
}

async function getStats(): Promise<UserStats> {
  const response = await apiClient.get<ApiResponse<UserStats>>('/dashboard/user-stats');
  return response.data.data;
}

export const dashboardApi = { getStats };
