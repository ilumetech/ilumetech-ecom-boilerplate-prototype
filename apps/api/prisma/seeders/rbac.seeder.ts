import { PrismaClient } from '@prisma/client';
import {
  ALL_PERMISSIONS,
  BASE_ROLE_DEFINITIONS,
  BASE_ROLES,
} from '@ilumetech/types';

async function upsertPermissions(prisma: PrismaClient): Promise<void> {
  for (const action of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action },
    });
  }
}

async function upsertRole(
  prisma: PrismaClient,
  name: string,
  description: string,
): Promise<string> {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
  return role.id;
}

async function assignPermissionsToRole(
  prisma: PrismaClient,
  roleId: string,
): Promise<void> {
  for (const action of ALL_PERMISSIONS) {
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { action },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permission.id } },
      update: {},
      create: { roleId, permissionId: permission.id },
    });
  }
}

export async function seedRbac(prisma: PrismaClient): Promise<void> {
  await upsertPermissions(prisma);

  for (const roleDef of BASE_ROLE_DEFINITIONS) {
    const roleId = await upsertRole(prisma, roleDef.name, roleDef.description);

    if (roleDef.name === BASE_ROLES.ADMIN) {
      await assignPermissionsToRole(prisma, roleId);
    }
  }
}
