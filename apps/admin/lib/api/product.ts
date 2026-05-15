import { apiClient } from './client';
import type { Product, PaginatedResponse, ApiResponse } from '@ilumetech/types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  productCategoryId?: string;
  colorId?: string;
  isActive?: boolean;
}

interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string;
  colorId?: string;
  badge?: string;
  productCategoryId: string;
  unitId: string;
  sellingPrice: number;
  purchasePrice?: number;
  isActive?: boolean;
}


interface UpdateProductPayload {
  name?: string;
  slug?: string;
  description?: string;
  colorId?: string;
  badge?: string;
  productCategoryId?: string;
  unitId?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  isActive?: boolean;
}


async function getAll(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
  const response = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
  return response.data;
}

async function getById(id: string): Promise<Product> {
  const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data.data;
}

async function create(payload: CreateProductPayload): Promise<ApiResponse<Product>> {
  const response = await apiClient.post<ApiResponse<Product>>('/products', payload);
  return response.data;
}

async function update(id: string, payload: UpdateProductPayload): Promise<ApiResponse<Product>> {
  const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, payload);
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export const productApi = { getAll, getById, create, update, remove };
