export interface ProductCategoryRef {
  id: string;
  name: string;
}

export interface ColorRef {
  id: string;
  name: string;
  hexCode: string | null;
}

export interface UnitRef {
  id: string;
  name: string;
  abbreviation: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  productId: string;
}

export interface ProductOptionValue {
  id: string;
  optionId: string;
  value: string;
  position: number;
}

export interface ProductOption {
  id: string;
  name: string;
  position: number;
  values: ProductOptionValue[];
}

export interface ProductVariantOptionValue {
  optionName: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  finalPrice: number;
  compareAtPrice: number | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
  discountValue: number | null;
  discountMode: "AUTOMATIC" | "MANUAL" | null;
  imageUrl: string | null;
  isActive: boolean;
  stockOnHand: number;
  optionValues: ProductVariantOptionValue[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  productCategoryId: string;
  productCategory: ProductCategoryRef;
  unitId: string;
  unit: UnitRef;
  sellingPrice: number;
  purchasePrice: number | null;
  weightGram: number | null;
  isActive: boolean;
  images?: ProductImage[];
  options?: ProductOption[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}
