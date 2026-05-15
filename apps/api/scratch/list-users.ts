import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true },
  });

  console.log('--- Current Users in Database ---');
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    users.forEach(u => {
      console.log(`- Email: ${u.email}, ID: ${u.id}, Role: ${u.role?.name ?? 'NONE'}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
