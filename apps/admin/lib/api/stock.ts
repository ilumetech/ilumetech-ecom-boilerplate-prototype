import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  StockMovement,
  StockMovementType,
  StockReferenceType,
  StockVariant,
} from "@ilumetech/types";

export interface StockVariantQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
}

export interface StockMovementQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  type?: StockMovementType;
  referenceType?: StockReferenceType;
  referenceId?: string;
}

export interface CreateStockMovementPayload {
  type: StockMovementType;
  quantity: number;
  referenceType?: StockReferenceType;
  referenceId?: string;
  reason?: string;
  note?: string;
}

async function getVariants(
  params?: StockVariantQueryParams,
): Promise<PaginatedResponse<StockVariant>> {
  const response = await apiClient.get<PaginatedResponse<StockVariant>>(
    "/stock/variants",
    { params },
  );
  return response.data;
}

async function getMovements(
  variantId: string,
  params?: StockMovementQueryParams,
): Promise<PaginatedResponse<StockMovement>> {
  const response = await apiClient.get<PaginatedResponse<StockMovement>>(
    `/stock/variants/${variantId}/movements`,
    { params },
  );
  return response.data;
}

async function createMovement(
  variantId: string,
  payload: CreateStockMovementPayload,
): Promise<ApiResponse<StockMovement>> {
  const response = await apiClient.post<ApiResponse<StockMovement>>(
    `/stock/variants/${variantId}/movements`,
    payload,
  );
  return response.data;
}

export const stockApi = { getVariants, getMovements, createMovement };
