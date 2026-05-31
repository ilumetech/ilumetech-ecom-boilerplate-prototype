import { PrismaClient } from '@prisma/client';
import { PromoCodeService } from '../src/promo-code/promo-code.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

const prismaService = new PrismaService();

async function main() {
  console.log('--- Testing PromoCodeService ---');
  const service = new PromoCodeService(prismaService);

  // Clean up any old test codes
  await prismaService.promoCode.deleteMany({
    where: { code: { in: ['TEST50', 'TEST_EXPIRED', 'TEST_LIMIT'] } },
  });

  // 1. Create a PERCENTAGE promo code
  const percentagePromo = await service.create({
    code: 'TEST50',
    description: 'Test 50% discount up to Rp 50.000',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    minOrderAmount: 100000,
    maxDiscount: 50000,
    isActive: true,
  });
  console.log('Created percentage promo:', percentagePromo.code);

  // 2. Validate percentage promo (valid subtotal)
  const validation1 = await service.validateCode({
    code: 'test50', // test case insensitivity
    subtotal: 120000,
  });
  console.log('Validation 1 (subtotal 120k, 50% max 50k):', validation1);
  if (validation1.discountAmount !== 50000) {
    throw new Error('Discount amount should be capped at 50,000');
  }

  // 3. Validate percentage promo (valid subtotal below cap)
  const validation2 = await service.validateCode({
    code: 'TEST50',
    subtotal: 80000, // Should throw since min order is 100k!
  }).catch(err => {
    console.log('Validation 2 (subtotal 80k below min 100k) caught error as expected:', err.message);
    return null;
  });
  if (validation2 !== null) {
    throw new Error('Validation should have failed for minOrderAmount');
  }

  // 4. Create an expired promo code
  await service.create({
    code: 'TEST_EXPIRED',
    discountType: 'FIXED_AMOUNT',
    discountValue: 10000,
    startDate: new Date(Date.now() - 1000000).toISOString(),
    endDate: new Date(Date.now() - 500000).toISOString(),
    isActive: true,
  });

  const validationExpired = await service.validateCode({
    code: 'TEST_EXPIRED',
    subtotal: 100000,
  }).catch(err => {
    console.log('Validation Expired caught error as expected:', err.message);
    return null;
  });
  if (validationExpired !== null) {
    throw new Error('Validation should have failed for expired date');
  }

  // Clean up
  await prismaService.promoCode.deleteMany({
    where: { code: { in: ['TEST50', 'TEST_EXPIRED', 'TEST_LIMIT'] } },
  });

  console.log('--- PromoCodeService Test Passed! ---');
}

main()
  .catch(console.error)
  .finally(() => prismaService.$disconnect());
