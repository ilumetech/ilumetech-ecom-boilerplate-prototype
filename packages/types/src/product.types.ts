import { AttributeValue } from './attribute.types';

export interface ProductCategoryRef {
  id: string;
  name: string;
}

export interface ColorRef {
  id: string;
  name: string;
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

export interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  stock: number;
  productId: string;
  attributes: AttributeValue[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  colorId: string | null;
  color: ColorRef | null;
  badge: string | null;
  productCategoryId: string;
  productCategory: ProductCategoryRef;
  unitId: string;
  unit: UnitRef;
  sellingPrice: number;
  purchasePrice: number | null;
  isActive: boolean;
  images?: ProductImage[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}
