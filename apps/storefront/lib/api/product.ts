import type { ApiResponse, PaginatedResponse, Product } from "@ilumetech/types";

export type StorefrontProduct = Omit<Product, "purchasePrice">;

interface ProductListParams {
  limit?: number;
  page?: number;
  productCategoryId?: string;
  search?: string;
  sortField?: "name" | "code" | "sellingPrice" | "createdAt";
  sortOrder?: "asc" | "desc";
  color?: string;
  minPrice?: number;
  maxPrice?: number;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required to load products.");
  }

  return baseUrl;
}

function buildQueryString(params: ProductListParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getProducts(
  params: ProductListParams = {},
): Promise<PaginatedResponse<StorefrontProduct>> {
  const response = await fetch(
    `${getApiBaseUrl()}/public/products${buildQueryString(params)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`);
  }

  return response.json() as Promise<PaginatedResponse<StorefrontProduct>>;
}

export async function getProductBySlug(
  slug: string,
): Promise<StorefrontProduct> {
  const response = await fetch(`${getApiBaseUrl()}/public/products/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load product: ${response.status}`);
  }

  const body = (await response.json()) as
    | ApiResponse<StorefrontProduct>
    | StorefrontProduct;

  return "data" in body ? body.data : body;
}

export async function getProductColors(): Promise<string[]> {
  const response = await fetch(`${getApiBaseUrl()}/public/products/colors`, {
    next: { revalidate: 300 }, // cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to load colors: ${response.status}`);
  }

  const body = (await response.json()) as { data: string[] };
  return body.data;
}
