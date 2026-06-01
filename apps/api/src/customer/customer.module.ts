import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, PermissionsGuard],
})
export class CustomerModule {}
