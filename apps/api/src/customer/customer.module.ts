import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { PublicCustomerController } from './public-customer.controller';
import { CustomerService } from './customer.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [CustomerController, PublicCustomerController],
  providers: [CustomerService, PermissionsGuard],
})
export class CustomerModule {}
