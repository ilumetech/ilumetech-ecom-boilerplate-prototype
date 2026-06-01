import { apiFetch } from "./client-fetch";
import type { AppCustomer } from "@ilumetech/types";

export async function getCustomerProfile(token: string): Promise<AppCustomer> {
  const res = await apiFetch<{ data: AppCustomer }>(
    "/public/customers/me",
    token,
  );
  return res.data;
}

export async function updateCustomerProfile(
  token: string,
  data: { firstName?: string; lastName?: string; username?: string },
): Promise<AppCustomer> {
  const res = await apiFetch<{ data: AppCustomer }>(
    "/public/customers/me",
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}
