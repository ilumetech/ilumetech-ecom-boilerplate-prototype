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
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: CreateOrderAddressInput;
  shippingMethod?: string;
  shippingAmount?: number;
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
