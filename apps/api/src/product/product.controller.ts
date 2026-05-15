import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Audit, Permissions, SensitiveFields } from '../common/decorators';
import { PERMISSIONS } from '../common/constants/permissions.constant';
import { ProductService } from './product.service';
import { CreateProductDto, QueryProductDto, UpdateProductDto } from './dto';

@Controller('products')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('product', AuditCategory.OPERATIONAL)
@SensitiveFields({ purchasePrice: PERMISSIONS.PRODUCT.VIEW_COST })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions(PERMISSIONS.PRODUCT.READ)
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PRODUCT.READ)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.PRODUCT.CREATE)
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PRODUCT.DELETE)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
