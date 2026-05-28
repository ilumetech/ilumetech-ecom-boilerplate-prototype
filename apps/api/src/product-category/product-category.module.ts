import { Module } from '@nestjs/common';
import { ProductCategoryController } from './product-category.controller';
import { PublicProductCategoryController } from './public-product-category.controller';
import { ProductCategoryService } from './product-category.service';
import { PermissionsGuard } from '../common/guards';

@Module({
  controllers: [ProductCategoryController, PublicProductCategoryController],
  providers: [ProductCategoryService, PermissionsGuard],
})
export class ProductCategoryModule {}
