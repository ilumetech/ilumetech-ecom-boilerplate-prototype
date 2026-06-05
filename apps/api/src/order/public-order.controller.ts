import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import type { ClerkUser } from '../common/types/clerk.types';
import { CreateOrderDto, QueryOrderDto } from './dto';
import { OrderService } from './order.service';

@Controller('public/orders')
@UseGuards(ClerkAuthGuard)
export class PublicOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@CurrentUser() user: ClerkUser, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.create(user.sub, dto);
    return { data: order };
  }

  @Get()
  findMine(@CurrentUser() user: ClerkUser, @Query() query: QueryOrderDto) {
    return this.orderService.findCustomerOrders(user.sub, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const order = await this.orderService.findOne(id);

    if (order.customerId !== user.sub) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return { data: order };
  }

  @Post(':id/refresh-status')
  async refreshStatus(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const order = await this.orderService.findOne(id);

    if (order.customerId !== user.sub) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    const refreshed = await this.orderService.refreshStatus(id, user.sub);
    return { data: refreshed };
  }
}
