import { Module } from '@nestjs/common';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategoryService } from './product-category.service';
import { PermissionsGuard } from '../common/guards';

@Module({
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService, PermissionsGuard],
})
export class ProductCategoryModule {}
