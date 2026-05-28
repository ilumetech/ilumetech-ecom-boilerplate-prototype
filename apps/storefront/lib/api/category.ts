import type { PaginatedResponse, ProductCategory } from "@ilumetech/types";

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required to load categories.");
  }

  return baseUrl;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/public/product-categories`,
    {
      next: { revalidate: 300 }, // cache for 5 minutes
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load categories: ${response.status}`);
  }

  const body = (await response.json()) as PaginatedResponse<ProductCategory>;
  return body.data;
}
