import { apiClient } from "./client";
import type { ApiResponse, PromoCode, PaginatedResponse } from "@ilumetech/types";

export interface PromoCodeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

interface CreatePromoCodePayload {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

interface UpdatePromoCodePayload {
  code?: string;
  description?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

async function getAll(
  params?: PromoCodeQueryParams,
): Promise<PaginatedResponse<PromoCode>> {
  const response = await apiClient.get<PaginatedResponse<PromoCode>>("/promo-codes", {
    params,
  });
  return response.data;
}

async function getById(id: string): Promise<PromoCode> {
  const response = await apiClient.get<ApiResponse<PromoCode>>(`/promo-codes/${id}`);
  return response.data.data;
}

async function create(
  payload: CreatePromoCodePayload,
): Promise<ApiResponse<PromoCode>> {
  const response = await apiClient.post<ApiResponse<PromoCode>>("/promo-codes", payload);
  return response.data;
}

async function update(
  id: string,
  payload: UpdatePromoCodePayload,
): Promise<ApiResponse<PromoCode>> {
  const response = await apiClient.patch<ApiResponse<PromoCode>>(
    `/promo-codes/${id}`,
    payload,
  );
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(`/promo-codes/${id}`);
}

export const promoCodeApi = { getAll, getById, create, update, remove };
