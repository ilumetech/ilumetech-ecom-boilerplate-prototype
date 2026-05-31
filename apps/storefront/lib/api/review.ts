import { apiFetch } from "./client-fetch";

export interface CreateReviewDto {
  productId: string;
  rating: number;
  comment?: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface ProductReviewsData {
  reviews: ProductReview[];
  averageRating: number;
  totalCount: number;
  distribution: RatingDistribution[];
}

export async function submitReview(
  dto: CreateReviewDto,
  token: string,
): Promise<ProductReview> {
  const res = await apiFetch<{ data: ProductReview }>("/public/reviews", token, {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data;
}

export async function getProductReviews(
  productId: string,
): Promise<ProductReviewsData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required to fetch product reviews.");
  }

  const response = await fetch(`${baseUrl}/public/products/${productId}/reviews`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load product reviews: ${response.status}`);
  }

  const body = (await response.json()) as { data: ProductReviewsData };
  return body.data;
}
