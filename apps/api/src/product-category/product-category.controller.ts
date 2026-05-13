import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Audit, Permissions } from '../common/decorators';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto, ProductCategoryQueryDto, UpdateProductCategoryDto } from './dto';

@Controller('product-categories')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('product-category', AuditCategory.OPERATIONAL)
export class ProductCategoryController {
  constructor(private readonly productCategoryService: ProductCategoryService) {}

  @Get()
  @Permissions('product-category:read')
  findAll(@Query() query: ProductCategoryQueryDto) {
    return this.productCategoryService.findAll(query);
  }

  @Get(':id')
  @Permissions('product-category:read')
  findOne(@Param('id') id: string) {
    return this.productCategoryService.findOne(id);
  }

  @Post()
  @Permissions('product-category:create')
  create(@Body() dto: CreateProductCategoryDto) {
    return this.productCategoryService.create(dto);
  }

  @Patch(':id')
  @Permissions('product-category:update')
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.productCategoryService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('product-category:delete')
  remove(@Param('id') id: string) {
    return this.productCategoryService.remove(id);
  }
}
