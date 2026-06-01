import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS, BASE_ROLE_DEFINITIONS, BASE_ROLES } from '@ilumetech/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting RBAC sync...');

  // 1. Sync all permissions
  console.log(`Syncing ${ALL_PERMISSIONS.length} permissions...`);
  for (const action of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action },
    });
  }
  console.log('Permissions synced.');

  // 2. Sync roles
  for (const roleDef of BASE_ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });
    console.log(`Role synced: ${role.name} (ID: ${role.id})`);

    // 3. Assign all permissions to the admin role
    if (role.name === BASE_ROLES.ADMIN) {
      console.log('Assigning all permissions to admin role...');
      const dbPermissions = await prisma.permission.findMany();
      for (const permission of dbPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
      console.log('All permissions assigned to admin role.');
    }
  }

  console.log('RBAC sync complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
