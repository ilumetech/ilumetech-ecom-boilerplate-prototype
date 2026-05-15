import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductOptionService } from './product-option.service';
import { ProductVariantService } from './product-variant.service';
import { PermissionsGuard } from '../common/guards';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductOptionService, ProductVariantService, PermissionsGuard],
})
export class ProductModule {}
