import { PrismaClient } from '@prisma/client';
import { seedShippingRates } from '../seeders/shipping-rate.seeder';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedShippingRates(prisma);
  process.stdout.write('Shipping rates imported.\n');
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
