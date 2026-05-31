import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { ValidatePromoCodeDto } from './dto';

@Controller('public/promo-codes')
export class PublicPromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidatePromoCodeDto) {
    return this.promoCodeService.validateCode(dto);
  }

  @Post('use')
  @HttpCode(HttpStatus.OK)
  use(@Body('code') code: string) {
    return this.promoCodeService.incrementUsage(code);
  }
}
