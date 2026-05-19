import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
    include: { permissions: { include: { permission: true } } },
  });

  if (!adminRole) {
    console.error('Admin role not found');
    return;
  }

  console.log(`--- Permissions for Role: ${adminRole.name} ---`);
  adminRole.permissions.forEach((rp) => {
    console.log(`- ${rp.permission.action}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
