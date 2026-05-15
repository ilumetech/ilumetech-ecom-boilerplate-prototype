import { PrismaClient } from '@prisma/client';

export async function seedProducts(prisma: PrismaClient) {
  const category = await prisma.productCategory.upsert({
    where: { name: 'Apparel' },
    update: {},
    create: {
      name: 'Apparel',
      slug: 'apparel',
      isActive: true,
    },
  });

  const unit = await prisma.unit.findFirst();
  if (!unit) return;

  const product = await prisma.product.upsert({
    where: { code: 'PRD-000001' },
    update: {},
    create: {
      code: 'PRD-000001',
      name: 'Basic Cotton T-Shirt',
      slug: 'basic-cotton-t-shirt',
      description: 'A comfortable cotton t-shirt.',
      productCategoryId: category.id,
      unitId: unit.id,
      sellingPrice: 99000,
      isActive: true,
    },
  });

  const sizeOption = await prisma.productOption.upsert({
    where: { productId_name: { productId: product.id, name: 'Size' } },
    update: {},
    create: {
      productId: product.id,
      name: 'Size',
      position: 1,
      values: {
        create: [
          { value: 'S', position: 1 },
          { value: 'M', position: 2 },
          { value: 'L', position: 3 },
        ],
      },
    },
    include: { values: true },
  });

  const colorOption = await prisma.productOption.upsert({
    where: { productId_name: { productId: product.id, name: 'Color' } },
    update: {},
    create: {
      productId: product.id,
      name: 'Color',
      position: 2,
      values: {
        create: [
          { value: 'Black', position: 1 },
          { value: 'White', position: 2 },
        ],
      },
    },
    include: { values: true },
  });

  // Create variants
  const sizeS = sizeOption.values.find((v) => v.value === 'S');
  const sizeM = sizeOption.values.find((v) => v.value === 'M');
  const colorBlack = colorOption.values.find((v) => v.value === 'Black');

  if (sizeS && colorBlack) {
    await prisma.productVariant.upsert({
      where: { sku: 'TSHIRT-BLK-S' },
      update: {},
      create: {
        productId: product.id,
        sku: 'TSHIRT-BLK-S',
        name: 'Black / S',
        price: 99000,
        isDefault: true,
        isActive: true,
        optionValues: {
          create: [
            { optionValueId: sizeS.id },
            { optionValueId: colorBlack.id },
          ],
        },
      },
    });
  }

  if (sizeM && colorBlack) {
    await prisma.productVariant.upsert({
      where: { sku: 'TSHIRT-BLK-M' },
      update: {},
      create: {
        productId: product.id,
        sku: 'TSHIRT-BLK-M',
        name: 'Black / M',
        price: 99000,
        isDefault: false,
        isActive: true,
        optionValues: {
          create: [
            { optionValueId: sizeM.id },
            { optionValueId: colorBlack.id },
          ],
        },
      },
    });
  }
}
