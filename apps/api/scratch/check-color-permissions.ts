import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  const permissions = await prisma.permission.findMany({
    where: {
      action: {
        contains: 'color',
      },
    },
  });
  console.log('Color permissions in DB:', permissions);

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  roles.forEach((role) => {
    const hasColorRead = role.permissions.some(
      (p) => p.permission.action === 'color:read',
    );
    console.log(`Role: ${role.name}, Has color:read: ${hasColorRead}`);
  });
}

checkPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
