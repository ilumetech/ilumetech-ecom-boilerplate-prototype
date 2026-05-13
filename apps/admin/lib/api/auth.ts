import { apiClient } from './client';

export interface MeData {
  clerkUserId: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

async function getMe(): Promise<MeData> {
  const response = await apiClient.get<{ data: MeData }>('/auth/me');
  return response.data.data;
}

export const authApi = { getMe };
