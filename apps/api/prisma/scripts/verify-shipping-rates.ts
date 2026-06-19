import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [rates, destinations, jakartaResults] = await Promise.all([
    prisma.shippingRate.count(),
    prisma.shippingRate.findMany({
      select: { destinationCode: true },
      distinct: ['destinationCode'],
    }),
    prisma.shippingRate.findMany({
      where: {
        destinationLabel: { contains: 'JAKARTA', mode: 'insensitive' },
      },
      select: {
        destinationCode: true,
        destinationLabel: true,
      },
      distinct: ['destinationCode'],
      orderBy: { destinationLabel: 'asc' },
      take: 5,
    }),
  ]);

  process.stdout.write(
    `Database shipping rates: ${rates}; destinations: ${destinations.length}; search results: ${jakartaResults.length}\n`,
  );
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
