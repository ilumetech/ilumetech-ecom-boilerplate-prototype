import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Audit, Permissions } from '../common/decorators';
import { ProductService } from './product.service';
import { CreateProductDto, QueryProductDto, UpdateProductDto } from './dto';

@Controller('products')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('product', AuditCategory.OPERATIONAL)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions('product:read')
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Permissions('product:read')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @Permissions('product:create')
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @Permissions('product:update')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('product:delete')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
