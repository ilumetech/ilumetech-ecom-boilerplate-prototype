import { PrismaClient } from '@prisma/client';

const UNIT_DATA = [
  { name: 'Pieces', abbreviation: 'pcs' },
  { name: 'Kilogram', abbreviation: 'kg' },
  { name: 'Gram', abbreviation: 'gram' },
  { name: 'Liter', abbreviation: 'liter' },
  { name: 'Meter', abbreviation: 'meter' },
  { name: 'Sentimeter', abbreviation: 'cm' },
  { name: 'Box', abbreviation: 'box' },
];

export async function seedUnits(prisma: PrismaClient): Promise<void> {
  for (const unit of UNIT_DATA) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: { abbreviation: unit.abbreviation },
      create: unit,
    });
  }
}
