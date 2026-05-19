import { apiClient } from "./client";
import type { ApiResponse } from "@ilumetech/types";

export interface UserStats {
  active: number;
  inactive: number;
  total: number;
}

export interface ProductStats {
  active: number;
  inactive: number;
  total: number;
}

export interface CategoryStatsItem {
  name: string;
  value: number;
}

async function getStats(): Promise<UserStats> {
  const response = await apiClient.get<ApiResponse<UserStats>>(
    "/dashboard/user-stats",
  );
  return response.data.data;
}

async function getProductStats(): Promise<ProductStats> {
  const response = await apiClient.get<ApiResponse<ProductStats>>(
    "/dashboard/product-stats",
  );
  return response.data.data;
}

async function getCategoryStats(): Promise<CategoryStatsItem[]> {
  const response = await apiClient.get<ApiResponse<CategoryStatsItem[]>>(
    "/dashboard/category-stats",
  );
  return response.data.data;
}

export const dashboardApi = { getStats, getProductStats, getCategoryStats };
