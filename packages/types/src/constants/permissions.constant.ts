export const PERMISSIONS = {
  USER: {
    READ: "user:read",
    INVITE: "user:invite",
    UPDATE: "user:update",
    DELETE: "user:delete",
  },
  ROLE: {
    CREATE: "role:create",
    READ: "role:read",
    UPDATE: "role:update",
    DELETE: "role:delete",
  },
  PRODUCT: {
    CREATE: "product:create",
    READ: "product:read",
    UPDATE: "product:update",
    DELETE: "product:delete",
    VIEW_COST: "product:view_cost",
    VIEW_PRICING: "product:view_pricing",
  },
  STOCK: {
    READ: "stock:read",
    UPDATE: "stock:update",
  },
  PRODUCT_CATEGORY: {
    CREATE: "product-category:create",
    READ: "product-category:read",
    UPDATE: "product-category:update",
    DELETE: "product-category:delete",
  },
  AUDIT_LOG: {
    READ: "audit-log:read",
  },
  DASHBOARD: {
    VIEW_USER_STATS: "dashboard:view_user_stats",
    VIEW_PRODUCT_STATS: "dashboard:view_product_stats",
    VIEW_CATEGORY_STATS: "dashboard:view_category_stats",
  },
  COLOR: {
    CREATE: "color:create",
    READ: "color:read",
    UPDATE: "color:update",
    DELETE: "color:delete",
  },
  PROMO_CODE: {
    CREATE: "promo-code:create",
    READ: "promo-code:read",
    UPDATE: "promo-code:update",
    DELETE: "promo-code:delete",
  },
} as const;

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flatMap(
  (module) => Object.values(module),
);
