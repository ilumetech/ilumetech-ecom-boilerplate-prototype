import { PrismaClient } from '@prisma/client';
import { seedRbac } from './seeders/rbac.seeder';
import { seedUnits } from './seeders/unit.seeder';
import { seedProductCounter, seedSystemConfig } from './seeders/system-config.seeder';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedRbac(prisma);
  await seedUnits(prisma);
  await seedProductCounter(prisma);
  await seedSystemConfig(prisma);
  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
