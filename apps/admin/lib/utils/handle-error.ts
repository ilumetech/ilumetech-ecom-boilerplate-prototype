import { type MessageInstance } from "antd/es/message/interface";
import { message } from "antd";

let staticMessage: MessageInstance | null = null;

export function setStaticMessage(instance: MessageInstance) {
  staticMessage = instance;
}

const FALLBACK = "Terjadi kesalahan. Silakan coba lagi.";

export function handleError(err: unknown): void {
  const msg = extractErrorMessage(err);
  if (staticMessage) {
    staticMessage.error(msg);
  } else {
    message.error(msg);
  }
}

function extractErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return FALLBACK;

  const axiosError = err as { response?: { data?: { error?: unknown } } };
  const apiError = axiosError.response?.data?.error;

  if (typeof apiError === "string" && apiError.length > 0) return apiError;
  return FALLBACK;
}
