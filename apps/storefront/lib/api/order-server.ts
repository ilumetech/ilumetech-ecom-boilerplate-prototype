import { apiFetch } from "./server-fetch";
import type { Order, PaginatedResponse } from "@ilumetech/types";
import type { OrderQueryParams } from "./order";

export async function getCustomerOrders(
  params?: OrderQueryParams,
): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams();
  if (params) {
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.search) query.append("search", params.search);
    if (params.sortField) query.append("sortField", params.sortField);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);
  }
  const queryString = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<PaginatedResponse<Order>>(`/public/orders${queryString}`);
}

export async function getCustomerOrder(id: string): Promise<Order> {
  const res = await apiFetch<{ data: Order }>(`/public/orders/${id}`);
  return res.data;
}
