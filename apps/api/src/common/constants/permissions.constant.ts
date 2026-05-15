export const PERMISSIONS = {
  USER: {
    READ:   'user:read',
    INVITE: 'user:invite',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
  },
  ROLE: {
    CREATE: 'role:create',
    READ:   'role:read',
    UPDATE: 'role:update',
    DELETE: 'role:delete',
  },
  PRODUCT: {
    CREATE:       'product:create',
    READ:         'product:read',
    UPDATE:       'product:update',
    DELETE:       'product:delete',
    VIEW_COST:    'product:view-cost',
    VIEW_PRICING: 'product:view-pricing',
  },
  PRODUCT_CATEGORY: {
    CREATE: 'product-category:create',
    READ:   'product-category:read',
    UPDATE: 'product-category:update',
    DELETE: 'product-category:delete',
  },
  STOCK: {
    CREATE: 'stock:create',
    READ:   'stock:read',
    UPDATE: 'stock:update',
    DELETE: 'stock:delete',
  },
  ORDER: {
    CREATE: 'order:create',
    READ:   'order:read',
    UPDATE: 'order:update',
    DELETE: 'order:delete',
  },
} as const;

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flatMap(
  (module) => Object.values(module),
);
