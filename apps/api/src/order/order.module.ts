import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PublicOrderController } from './public-order.controller';
import { MidtransService } from './midtrans.service';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [TrackingModule],
  controllers: [OrderController, PublicOrderController],
  providers: [OrderService, PermissionsGuard, MidtransService],
  exports: [OrderService, MidtransService],
})
export class OrderModule {}
