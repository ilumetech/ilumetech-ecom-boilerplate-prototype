import { apiClient } from "./client";
import type {
  AppUser,
  AppUserMe,
  PaginatedResponse,
  ApiResponse,
} from "@ilumetech/types";

interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive?: boolean;
  roleId?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
}

async function getUsers(
  params?: UserQueryParams,
): Promise<PaginatedResponse<AppUser>> {
  const response = await apiClient.get<PaginatedResponse<AppUser>>("/users", {
    params,
  });
  return response.data;
}

async function getUser(userId: string): Promise<AppUser> {
  const response = await apiClient.get<ApiResponse<AppUser>>(
    `/users/${userId}`,
  );
  return response.data.data;
}

async function createUser(
  payload: CreateUserPayload,
): Promise<ApiResponse<AppUser>> {
  const response = await apiClient.post<ApiResponse<AppUser>>(
    "/users/invite",
    payload,
  );
  return response.data;
}

async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<ApiResponse<AppUser>> {
  const response = await apiClient.patch<ApiResponse<AppUser>>(
    `/users/${userId}`,
    payload,
  );
  return response.data;
}

async function removeUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}

async function getMe(): Promise<AppUserMe> {
  const response = await apiClient.get<ApiResponse<AppUserMe>>("/users/me");
  return response.data.data;
}

export const userApi = {
  getMe,
  getUsers,
  getUser,
  createUser,
  updateUser,
  removeUser,
};
