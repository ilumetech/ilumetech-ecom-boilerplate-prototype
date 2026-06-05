import { auth } from "@clerk/nextjs/server";

interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const isWriteMethod = options?.method && ["POST", "PUT", "PATCH"].includes(options.method.toUpperCase());
  const body = isWriteMethod && options?.body === undefined ? JSON.stringify({}) : options?.body;

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    body,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options?.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
