import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding admin role...');
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    console.error('Error: Admin role not found. Please run seed first.');
    return;
  }

  console.log(`Admin role found (ID: ${adminRole.id})`);

  const users = await prisma.user.findMany({
    where: { roleId: null },
  });

  console.log(`Found ${users.length} users without a role.`);

  for (const user of users) {
    console.log(`Assigning admin role to user: ${user.email} (${user.id})...`);
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: adminRole.id },
    });
  }

  console.log('Success: All users have been assigned the admin role.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
