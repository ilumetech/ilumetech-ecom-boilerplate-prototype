import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { PERMISSIONS } from '@ilumetech/types';
import { Audit, GetCurrentUser, Permissions } from '../common/decorators';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { StockService } from './stock.service';
import {
  CreateStockMovementDto,
  StockMovementQueryDto,
  StockVariantQueryDto,
} from './dto';

@Controller('stock')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('stock', AuditCategory.OPERATIONAL)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('variants')
  @Permissions(PERMISSIONS.STOCK.READ)
  findVariants(@Query() query: StockVariantQueryDto) {
    return this.stockService.findVariants(query);
  }

  @Get('variants/:variantId/movements')
  @Permissions(PERMISSIONS.STOCK.READ)
  findMovements(
    @Param('variantId') variantId: string,
    @Query() query: StockMovementQueryDto,
  ) {
    return this.stockService.findMovements(variantId, query);
  }

  @Post('variants/:variantId/movements')
  @Permissions(PERMISSIONS.STOCK.UPDATE)
  createMovement(
    @Param('variantId') variantId: string,
    @Body() dto: CreateStockMovementDto,
    @GetCurrentUser() actorId: string,
  ) {
    return this.stockService.createMovement(variantId, dto, actorId);
  }
}
