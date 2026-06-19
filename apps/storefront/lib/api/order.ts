import { apiFetch } from "./client-fetch";
import type { Order, OrderStatus } from "@ilumetech/types";

export interface CreateOrderItemInput {
  productVariantId: string;
  quantity: number;
}

export interface CreateOrderAddressInput {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  shippingDestinationCode: string;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: CreateOrderAddressInput;
  shippingMethod?: string;
  shippingService: string;
  promoCode?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  status?: OrderStatus;
}

export async function createOrder(
  input: CreateOrderInput,
  token: string,
): Promise<Order> {
  const res = await apiFetch<{ data: Order }>("/public/orders", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function refreshOrderStatus(
  id: string,
  token: string,
): Promise<Order> {
  const res = await apiFetch<{ data: Order }>(
    `/public/orders/${id}/refresh-status`,
    token,
    {
      method: "POST",
    },
  );
  return res.data;
}

export interface TrackingHistoryItem {
  date: string;
  description: string;
}

export interface TrackingResult {
  courier: string;
  trackingCode: string;
  status: string;
  sender?: string;
  destination?: string;
  shippingDate?: string;
  recipient?: string;
  history: TrackingHistoryItem[];
}

export async function getOrderTracking(
  orderId: string,
  token: string,
): Promise<TrackingResult> {
  const res = await apiFetch<{ data: TrackingResult }>(
    `/public/orders/${orderId}/track`,
    token,
  );
  return res.data;
}
