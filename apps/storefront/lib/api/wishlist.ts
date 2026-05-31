import { apiFetch } from "./client-fetch";
import type { StorefrontProduct } from "./product";

export async function toggleWishlist(
  productId: string,
  token: string,
): Promise<boolean> {
  const res = await apiFetch<{ data: { wishlisted: boolean } }>(
    "/public/wishlist/toggle",
    token,
    {
      method: "POST",
      body: JSON.stringify({ productId }),
    },
  );
  return res.data.wishlisted;
}

export async function getWishlist(token: string): Promise<StorefrontProduct[]> {
  const res = await apiFetch<{ data: StorefrontProduct[] }>(
    "/public/wishlist",
    token,
  );
  return res.data;
}
