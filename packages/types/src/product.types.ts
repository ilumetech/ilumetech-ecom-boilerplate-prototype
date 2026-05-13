export interface ProductCategoryRef {
  id: string;
  name: string;
}

export interface UnitRef {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productCategoryId: string;
  productCategory: ProductCategoryRef;
  unitId: string;
  unit: UnitRef;
  sellingPrice: number;
  purchasePrice: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
