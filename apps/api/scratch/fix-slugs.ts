import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      slug: null as any
    }
  });

  console.log(`Found ${products.length} products with null slug`);

  for (const product of products) {
    const slug = product.name.toLowerCase().replace(/ /g, '-') + '-' + product.id.slice(-4);
    await prisma.product.update({
      where: { id: product.id },
      data: { slug }
    });
    console.log(`Updated product ${product.id} with slug ${slug}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
