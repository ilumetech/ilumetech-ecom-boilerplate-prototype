export interface Attribute {
  id: string;
  name: string;
  values?: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  value: string;
  meta: any;
  attributeId: string;
  attribute?: Attribute;
  createdAt: string;
  updatedAt: string;
}
