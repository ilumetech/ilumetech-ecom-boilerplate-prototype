import { PrismaClient } from '@prisma/client';

export async function seedProductCounter(prisma: PrismaClient): Promise<void> {
  await prisma.productCounter.upsert({
    where: { prefix: 'PRD' },
    update: {},
    create: { prefix: 'PRD', lastSeq: 0 },
  });
}

export async function seedSystemConfig(prisma: PrismaClient): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: 'product_code_prefix' },
    update: {},
    create: { key: 'product_code_prefix', value: 'PRD' },
  });
}
