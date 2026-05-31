export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
