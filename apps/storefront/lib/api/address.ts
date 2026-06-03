import { apiFetch } from "./client-fetch";

export interface CreateAddressInput {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAddresses(token: string): Promise<CustomerAddress[]> {
  const res = await apiFetch<{ data: CustomerAddress[] }>("/public/addresses", token);
  return res.data;
}

export async function createAddress(
  data: CreateAddressInput,
  token: string,
): Promise<CustomerAddress> {
  const res = await apiFetch<{ data: CustomerAddress }>("/public/addresses", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateAddress(
  id: string,
  data: UpdateAddressInput,
  token: string,
): Promise<CustomerAddress> {
  const res = await apiFetch<{ data: CustomerAddress }>(`/public/addresses/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteAddress(
  id: string,
  token: string,
): Promise<CustomerAddress> {
  const res = await apiFetch<{ data: CustomerAddress }>(`/public/addresses/${id}`, token, {
    method: "DELETE",
  });
  return res.data;
}

export async function setDefaultAddress(
  id: string,
  token: string,
): Promise<CustomerAddress> {
  const res = await apiFetch<{ data: CustomerAddress }>(`/public/addresses/${id}/default`, token, {
    method: "PATCH",
  });
  return res.data;
}
