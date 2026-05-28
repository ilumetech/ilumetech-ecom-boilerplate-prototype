import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      options: {
        include: {
          values: true,
        },
      },
      variants: {
        include: {
          optionValues: true,
        },
      },
    },
  });

  console.log(`Analyzing ${products.length} products...`);

  let repairCount = 0;

  for (const product of products) {
    if (!product.options || product.options.length === 0) {
      continue;
    }

    // Collect all valid option value records for this product
    const allOptionValues = product.options.flatMap((opt) =>
      opt.values.map((val) => ({
        id: val.id,
        value: val.value,
        optionName: opt.name,
      }))
    );

    for (const variant of product.variants) {
      if (variant.optionValues.length === 0) {
        console.log(`\nVariant "${variant.sku}" (${variant.name}) has no option values.`);

        // Split name parts (e.g. "ppp / 42" -> ["ppp", "42"])
        const nameParts = variant.name.split('/').map((s) => s.trim());
        const matchedValueIds: string[] = [];

        for (const part of nameParts) {
          const matchedVal = allOptionValues.find(
            (val) => val.value.toLowerCase() === part.toLowerCase()
          );
          if (matchedVal) {
            matchedValueIds.push(matchedVal.id);
          } else {
            console.log(`  Could not find option value for name part: "${part}"`);
          }
        }

        if (matchedValueIds.length > 0) {
          console.log(`  Repairing: connecting to option value IDs: ${JSON.stringify(matchedValueIds)}`);
          
          await prisma.productVariantOptionValue.deleteMany({
            where: { variantId: variant.id }
          });

          await prisma.productVariantOptionValue.createMany({
            data: matchedValueIds.map((id) => ({
              variantId: variant.id,
              optionValueId: id,
            }))
          });

          repairCount++;
        }
      }
    }
  }

  console.log(`\nRepair completed successfully! Connected ${repairCount} variants.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
