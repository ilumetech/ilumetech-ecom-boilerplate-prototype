import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PublicOrderController } from './public-order.controller';

@Module({
  controllers: [OrderController, PublicOrderController],
  providers: [OrderService, PermissionsGuard],
  exports: [OrderService],
})
export class OrderModule {}
