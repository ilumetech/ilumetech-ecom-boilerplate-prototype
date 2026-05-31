export interface PromoCodeValidationResult {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required to validate promo codes.");
  }

  return baseUrl;
}

export async function validatePromoCode(
  code: string,
  subtotal: number,
): Promise<PromoCodeValidationResult> {
  const response = await fetch(`${getApiBaseUrl()}/public/promo-codes/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, subtotal }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(", ")
      : errorBody?.message || `Validation failed with status ${response.status}`;
    throw new Error(message);
  }

  const result = await response.json();
  return result.data || result;
}

export async function usePromoCode(code: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/public/promo-codes/use`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`Failed to increment promo code usage: ${response.status}`);
  }
}
