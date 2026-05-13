import { message } from 'antd';

const FALLBACK = 'Terjadi kesalahan. Silakan coba lagi.';

export function handleError(err: unknown): void {
  message.error(extractErrorMessage(err));
}

function extractErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return FALLBACK;

  const axiosError = err as { response?: { data?: { error?: unknown } } };
  const apiError = axiosError.response?.data?.error;

  if (typeof apiError === 'string' && apiError.length > 0) return apiError;
  return FALLBACK;
}
