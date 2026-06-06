import { apiClient } from "./client";
import type {
  ApiResponse,
  Order,
  OrderStatus,
  PaginatedResponse,
} from "@ilumetech/types";

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  status?: OrderStatus;
}

async function getAll(
  params?: OrderQueryParams,
): Promise<PaginatedResponse<Order>> {
  const response = await apiClient.get<PaginatedResponse<Order>>("/orders", {
    params,
  });
  return response.data;
}

async function getById(id: string): Promise<Order> {
  const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  return response.data.data;
}

async function updateStatus(
  id: string,
  status: OrderStatus,
): Promise<ApiResponse<Order>> {
  const response = await apiClient.patch<ApiResponse<Order>>(
    `/orders/${id}/status`,
    { status },
  );
  return response.data;
}

async function updateTracking(
  id: string,
  shippingCourier: string | null,
  trackingCode: string | null,
): Promise<ApiResponse<Order>> {
  const response = await apiClient.patch<ApiResponse<Order>>(
    `/orders/${id}/tracking`,
    { shippingCourier, trackingCode },
  );
  return response.data;
}

export const orderApi = {
  getAll,
  getById,
  updateStatus,
  updateTracking,
};
