import { BadRequestException } from '@nestjs/common';
import type { CreateProductVariantDto } from './dto';

export function buildVariantPricingData(variant: CreateProductVariantDto) {
  const finalPrice = variant.finalPrice ?? variant.price;

  if (finalPrice > variant.price) {
    throw new BadRequestException(
      'Final price cannot be greater than base price',
    );
  }

  if (variant.discountMode === 'AUTOMATIC' && !variant.discountType) {
    throw new BadRequestException(
      'Automatic discounts require a discount type',
    );
  }

  if (variant.discountType && variant.discountValue == null) {
    throw new BadRequestException(
      'Discount value is required when discount type is provided',
    );
  }

  return {
    price: variant.price,
    finalPrice,
    discountType: variant.discountType,
    discountValue: variant.discountValue,
    discountMode: variant.discountMode,
  };
}
