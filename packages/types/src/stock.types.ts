export type StockMovementType =
  | "IN"
  | "OUT"
  | "MANUAL_IN"
  | "MANUAL_OUT"
  | "OPNAME_IN"
  | "OPNAME_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "WRITE_OFF";

export type StockReferenceType = "ORDER" | "PURCHASE" | "RETURN" | "TRANSFER";

export interface StockVariantProductRef {
  id: string;
  code: string;
  name: string;
}

export interface StockVariant {
  id: string;
  sku: string;
  name: string;
  stockOnHand: number;
  isActive: boolean;
  product: StockVariantProductRef;
}

export interface StockMovement {
  id: string;
  productVariantId: string;
  type: StockMovementType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: StockReferenceType | null;
  referenceId: string | null;
  reason: string | null;
  note: string | null;
  actorId: string;
  createdAt: string;
}
