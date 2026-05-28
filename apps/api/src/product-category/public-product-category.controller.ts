import { Controller, Get, Query } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryQueryDto } from './dto';

@Controller('public/product-categories')
export class PublicProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Get()
  findAll(@Query() query: ProductCategoryQueryDto) {
    return this.productCategoryService.findAll({
      ...query,
      isActive: true,
      limit: 100, // Fetch all active categories for the public catalog filters
    });
  }
}
