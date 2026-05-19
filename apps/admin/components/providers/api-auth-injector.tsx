"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiClient } from "@/lib/api/client";

export function ApiAuthInjector() {
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const requestId = apiClient.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    const responseId = apiClient.interceptors.response.use(
      (response) => response,
      (error: { response?: { status: number } }) => {
        if (error.response?.status === 401) router.push("/sign-in");
        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.request.eject(requestId);
      apiClient.interceptors.response.eject(responseId);
    };
  }, [getToken, router]);

  return null;
}
