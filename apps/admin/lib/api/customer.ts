import { apiClient } from "./client";
import type {
  AppCustomer,
  PaginatedResponse,
  ApiResponse,
} from "@ilumetech/types";

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
}

interface UpdateCustomerPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive?: boolean;
}

async function getCustomers(
  params?: CustomerQueryParams,
): Promise<PaginatedResponse<AppCustomer>> {
  const response = await apiClient.get<PaginatedResponse<AppCustomer>>("/customers", {
    params,
  });
  return response.data;
}

async function getCustomer(customerId: string): Promise<AppCustomer> {
  const response = await apiClient.get<ApiResponse<AppCustomer>>(
    `/customers/${customerId}`,
  );
  return response.data.data;
}

async function updateCustomer(
  customerId: string,
  payload: UpdateCustomerPayload,
): Promise<ApiResponse<AppCustomer>> {
  const response = await apiClient.patch<ApiResponse<AppCustomer>>(
    `/customers/${customerId}`,
    payload,
  );
  return response.data;
}

async function removeCustomer(customerId: string): Promise<void> {
  await apiClient.delete(`/customers/${customerId}`);
}

export const customerApi = {
  getCustomers,
  getCustomer,
  updateCustomer,
  removeCustomer,
};
