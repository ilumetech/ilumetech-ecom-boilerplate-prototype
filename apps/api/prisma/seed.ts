import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_PERMISSION_ACTIONS = [
  'user:read', 'user:invite', 'user:update', 'user:delete',
  'product:create', 'product:read', 'product:update', 'product:delete',
  'product-category:create', 'product-category:read', 'product-category:update', 'product-category:delete',
  'stock:create', 'stock:read', 'stock:update', 'stock:delete',
  'order:create', 'order:read', 'order:update', 'order:delete',
  'role:create', 'role:read', 'role:update', 'role:delete',
];

const MANAGER_PERMISSION_ACTIONS = [
  'user:read', 'user:update',
  'product:read', 'product:update',
  'product-category:read', 'product-category:update',
  'stock:read', 'stock:update',
  'order:read', 'order:update',
];

const STAFF_PERMISSION_ACTIONS = [
  'user:read',
  'product:read',
  'product-category:read',
  'stock:read',
  'order:read',
];

const UNIT_DATA = [
  { name: 'Pieces',     abbreviation: 'pcs'   },
  { name: 'Kilogram',   abbreviation: 'kg'    },
  { name: 'Gram',       abbreviation: 'gram'  },
  { name: 'Liter',      abbreviation: 'liter' },
  { name: 'Meter',      abbreviation: 'meter' },
  { name: 'Sentimeter', abbreviation: 'cm'    },
  { name: 'Box',        abbreviation: 'box'   },
];

const ROLE_DEFINITIONS = [
  { name: 'admin', description: 'Full access to all resources', actions: ALL_PERMISSION_ACTIONS },
  { name: 'manager', description: 'Read and update access', actions: MANAGER_PERMISSION_ACTIONS },
  { name: 'staff', description: 'Read-only access', actions: STAFF_PERMISSION_ACTIONS },
];

async function upsertPermissions(): Promise<void> {
  for (const action of ALL_PERMISSION_ACTIONS) {
    await prisma.permission.upsert({ where: { action }, update: {}, create: { action } });
  }
}

async function upsertRole(name: string, description: string): Promise<string> {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
  return role.id;
}

async function assignPermissionsToRole(roleId: string, actions: string[]): Promise<void> {
  for (const action of actions) {
    const permission = await prisma.permission.findUniqueOrThrow({ where: { action } });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permission.id } },
      update: {},
      create: { roleId, permissionId: permission.id },
    });
  }
}

async function seedRoles(): Promise<void> {
  for (const roleDef of ROLE_DEFINITIONS) {
    const roleId = await upsertRole(roleDef.name, roleDef.description);
    await assignPermissionsToRole(roleId, roleDef.actions);
  }
}

async function seedUnits(): Promise<void> {
  for (const unit of UNIT_DATA) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: { abbreviation: unit.abbreviation },
      create: unit,
    });
  }
}

async function seedProductCounter(): Promise<void> {
  await prisma.productCounter.upsert({
    where: { prefix: 'PRD' },
    update: {},
    create: { prefix: 'PRD', lastSeq: 0 },
  });
}

async function seedSystemConfig(): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: 'product_code_prefix' },
    update: {},
    create: { key: 'product_code_prefix', value: 'PRD' },
  });
}

async function main(): Promise<void> {
  await upsertPermissions();
  await seedRoles();
  await seedUnits();
  await seedProductCounter();
  await seedSystemConfig();
  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
