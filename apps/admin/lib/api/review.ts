import { apiClient } from "./client";
import type { PaginatedResponse, ApiResponse } from "@ilumetech/types";

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "FLAGGED";
  createdAt: string;
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  product: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "PENDING" | "APPROVED" | "FLAGGED";
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

async function getAll(
  params?: ReviewQueryParams,
): Promise<PaginatedResponse<Review>> {
  const response = await apiClient.get<PaginatedResponse<Review>>("/reviews", {
    params,
  });
  return response.data;
}

async function updateStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "FLAGGED",
): Promise<ApiResponse<Review>> {
  const response = await apiClient.patch<ApiResponse<Review>>(
    `/reviews/${id}/status`,
    {
      status,
    },
  );
  return response.data;
}

export const reviewApi = { getAll, updateStatus };
