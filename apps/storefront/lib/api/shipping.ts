import { apiFetch } from "./client-fetch";

export interface ShippingDestination {
  destinationCode: string;
  destinationLabel: string;
}

export interface ShippingQuote {
  courier: "JNE";
  service: string;
  shipmentType: string;
  destinationCode: string;
  destinationLabel: string;
  weightGram: number;
  chargeableWeightKg: number;
  amount: number;
  etd: string | null;
}

interface ShippingQuoteItem {
  productVariantId: string;
  quantity: number;
}

export async function searchShippingDestinations(
  search: string,
  token: string,
): Promise<ShippingDestination[]> {
  const query = new URLSearchParams({
    search,
    page: "1",
    limit: "30",
  });
  const response = await apiFetch<{ data: ShippingDestination[] }>(
    `/public/shipping/destinations?${query.toString()}`,
    token,
  );
  return response.data;
}

export async function getShippingQuotes(
  destinationCode: string,
  items: ShippingQuoteItem[],
  token: string,
): Promise<ShippingQuote[]> {
  const response = await apiFetch<{ data: ShippingQuote[] }>(
    "/public/shipping/quote",
    token,
    {
      method: "POST",
      body: JSON.stringify({ destinationCode, items }),
    },
  );
  return response.data;
}
