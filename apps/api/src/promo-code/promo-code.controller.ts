import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { PERMISSIONS } from '@ilumetech/types';
import { Audit, Permissions } from '../common/decorators';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { PromoCodeService } from './promo-code.service';
import {
  CreatePromoCodeDto,
  QueryPromoCodeDto,
  UpdatePromoCodeDto,
} from './dto';

@Controller('promo-codes')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('promo-code', AuditCategory.OPERATIONAL)
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Get()
  @Permissions(PERMISSIONS.PROMO_CODE.READ)
  findAll(@Query() query: QueryPromoCodeDto) {
    return this.promoCodeService.findAll(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PROMO_CODE.READ)
  findOne(@Param('id') id: string) {
    return this.promoCodeService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.PROMO_CODE.CREATE)
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promoCodeService.create(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PROMO_CODE.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promoCodeService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PROMO_CODE.DELETE)
  remove(@Param('id') id: string) {
    return this.promoCodeService.remove(id);
  }
}
