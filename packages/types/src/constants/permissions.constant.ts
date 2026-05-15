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
    VIEW_COST:    'product:view_cost',
    VIEW_PRICING: 'product:view_pricing',
  },
  PRODUCT_CATEGORY: {
    CREATE: 'product-category:create',
    READ:   'product-category:read',
    UPDATE: 'product-category:update',
    DELETE: 'product-category:delete',
  },
  AUDIT_LOG: {
    READ: 'audit-log:read',
  },
  DASHBOARD: {
    VIEW_USER_STATS: 'dashboard:view_user_stats',
  },
} as const;

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flatMap(
  (module) => Object.values(module),
);
