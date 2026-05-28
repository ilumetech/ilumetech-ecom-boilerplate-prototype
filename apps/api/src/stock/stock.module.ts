import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  controllers: [StockController],
  providers: [StockService, PermissionsGuard],
})
export class StockModule {}
