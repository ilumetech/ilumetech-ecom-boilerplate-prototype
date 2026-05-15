import { apiClient } from "./client";
import type { ApiResponse, Color, PaginatedResponse } from "@ilumetech/types";

export interface ColorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

interface CreateColorPayload {
  name: string;
}

interface UpdateColorPayload {
  name?: string;
}

async function getAll(params?: ColorQueryParams): Promise<PaginatedResponse<Color>> {
  const response = await apiClient.get<PaginatedResponse<Color>>("/colors", { params });
  return response.data;
}

async function getById(id: string): Promise<Color> {
  const response = await apiClient.get<ApiResponse<Color>>(`/colors/${id}`);
  return response.data.data;
}

async function create(payload: CreateColorPayload): Promise<ApiResponse<Color>> {
  const response = await apiClient.post<ApiResponse<Color>>("/colors", payload);
  return response.data;
}

async function update(id: string, payload: UpdateColorPayload): Promise<ApiResponse<Color>> {
  const response = await apiClient.patch<ApiResponse<Color>>(`/colors/${id}`, payload);
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(`/colors/${id}`);
}

export const colorApi = { getAll, getById, create, update, remove };
