interface ApiErrorBody {
  message?: string
  error?: string
  statusCode?: number
}

export async function apiFetch<T>(
  path: string,
  token: string | null,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options?.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({}))
    throw new Error(body.message ?? `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
