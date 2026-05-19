import { apiClient } from "./client";
import type { AppRole, ApiResponse } from "@ilumetech/types";

async function getRoles(): Promise<AppRole[]> {
  const response = await apiClient.get<ApiResponse<AppRole[]>>("/roles");
  return response.data.data;
}

export const roleApi = { getRoles };
