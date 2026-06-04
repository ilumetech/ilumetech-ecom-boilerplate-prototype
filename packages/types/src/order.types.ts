export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string | null;
  optionSummary: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  status: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  promoCode: string | null;
  shippingMethod: string | null;
  shippingAddress: OrderAddress;
  snapToken?: string | null;
  snapUrl?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
