import { PrismaClient } from '@prisma/client';
import { seedRbac } from './seeders/rbac.seeder';
import { seedUnits } from './seeders/unit.seeder';
import {
  seedProductCounter,
  seedSystemConfig,
} from './seeders/system-config.seeder';
import { seedProducts } from './seeders/product.seeder';
import { seedShippingRates } from './seeders/shipping-rate.seeder';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedRbac(prisma);
  await seedUnits(prisma);
  await seedProductCounter(prisma);
  await seedSystemConfig(prisma);
  await seedProducts(prisma);
  await seedShippingRates(prisma);
  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
