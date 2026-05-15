export const BASE_ROLES = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  STAFF:   'staff',
} as const;

export const BASE_ROLE_DEFINITIONS = [
  { name: BASE_ROLES.ADMIN,   description: 'Full access to all resources' },
  { name: BASE_ROLES.MANAGER, description: 'Read and update access' },
  { name: BASE_ROLES.STAFF,   description: 'Read-only access' },
] as const;
