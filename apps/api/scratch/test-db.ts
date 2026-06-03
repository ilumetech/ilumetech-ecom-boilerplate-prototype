import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- Users ---');
  console.log(users);

  const customers = await prisma.customer.findMany();
  console.log('--- Customers ---');
  console.log(customers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
