import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PermissionsGuard } from '../common/guards';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PermissionsGuard],
})
export class ProductModule {}
