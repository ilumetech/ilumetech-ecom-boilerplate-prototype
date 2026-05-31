import { Module } from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { PromoCodeController } from './promo-code.controller';
import { PublicPromoCodeController } from './public-promo-code.controller';

@Module({
  controllers: [PromoCodeController, PublicPromoCodeController],
  providers: [PromoCodeService],
  exports: [PromoCodeService],
})
export class PromoCodeModule {}
