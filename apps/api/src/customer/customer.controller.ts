import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Audit, Permissions } from '../common/decorators';
import { PERMISSIONS } from '@ilumetech/types';
import { CustomerService } from './customer.service';
import { CustomerQueryDto, UpdateCustomerDto } from './dto';

@Controller('customers')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('customer', AuditCategory.OPERATIONAL)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Permissions(PERMISSIONS.CUSTOMER.READ)
  findAll(@Query() query: CustomerQueryDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CUSTOMER.READ)
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.CUSTOMER.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.CUSTOMER.DELETE)
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
