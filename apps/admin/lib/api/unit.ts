import { apiClient } from "./client";
import type { Unit } from "@ilumetech/types";

async function getAll(): Promise<Unit[]> {
  const response = await apiClient.get<{ data: Unit[] }>("/units");
  return response.data.data;
}

export const unitApi = { getAll };
