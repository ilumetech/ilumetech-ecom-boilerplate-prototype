import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function main() {
  const categories = await prisma.productCategory.findMany({
    where: { slug: null as any },
  });

  console.log(`Found ${categories.length} categories without slugs.`);

  for (const category of categories) {
    const slug = slugify(category.name);
    await prisma.productCategory.update({
      where: { id: category.id },
      data: { slug },
    });
    console.log(`Updated category "${category.name}" with slug "${slug}".`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
