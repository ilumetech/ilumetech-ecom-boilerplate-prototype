import { apiClient } from "./client";
import type {
  ProductCategory,
  PaginatedResponse,
  ApiResponse,
} from "@ilumetech/types";

export interface ProductCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
}

interface CreateProductCategoryPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateProductCategoryPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

async function getAll(
  params?: ProductCategoryQueryParams,
): Promise<PaginatedResponse<ProductCategory>> {
  const response = await apiClient.get<PaginatedResponse<ProductCategory>>(
    "/product-categories",
    { params },
  );
  return response.data;
}

async function getById(id: string): Promise<ProductCategory> {
  const response = await apiClient.get<ApiResponse<ProductCategory>>(
    `/product-categories/${id}`,
  );
  return response.data.data;
}

async function create(
  payload: CreateProductCategoryPayload,
): Promise<ApiResponse<ProductCategory>> {
  const response = await apiClient.post<ApiResponse<ProductCategory>>(
    "/product-categories",
    payload,
  );
  return response.data;
}

async function update(
  id: string,
  payload: UpdateProductCategoryPayload,
): Promise<ApiResponse<ProductCategory>> {
  const response = await apiClient.patch<ApiResponse<ProductCategory>>(
    `/product-categories/${id}`,
    payload,
  );
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(`/product-categories/${id}`);
}

export const productCategoryApi = { getAll, getById, create, update, remove };
