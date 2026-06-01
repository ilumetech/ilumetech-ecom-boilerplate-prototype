import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@ilumetech/types';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { QueryOrderDto } from './dto';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions(PERMISSIONS.ORDER.READ)
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDER.READ)
  async findOne(@Param('id') id: string) {
    const order = await this.orderService.findOne(id);
    return { data: order };
  }
}
