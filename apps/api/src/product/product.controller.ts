import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Audit, Permissions, SensitiveFields } from '../common/decorators';
import { PERMISSIONS } from '@ilumetech/types';
import { ProductService } from './product.service';
import { ProductOptionService } from './product-option.service';
import { ProductVariantService } from './product-variant.service';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
  CreateProductOptionDto,
  UpdateProductOptionDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto';

@Controller('products')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('product', AuditCategory.OPERATIONAL)
@SensitiveFields({ purchasePrice: PERMISSIONS.PRODUCT.VIEW_COST })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly optionService: ProductOptionService,
    private readonly variantService: ProductVariantService,
  ) { }

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

  // Product Options
  @Get(':productId/options')
  @Permissions(PERMISSIONS.PRODUCT.READ)
  findAllOptions(@Param('productId') productId: string) {
    return this.optionService.findAll(productId);
  }

  @Post(':productId/options')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  createOption(@Param('productId') productId: string, @Body() dto: CreateProductOptionDto) {
    return this.optionService.create(productId, dto);
  }

  @Patch(':productId/options/:optionId')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  updateOption(
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateProductOptionDto,
  ) {
    return this.optionService.update(productId, optionId, dto);
  }

  @Delete(':productId/options/:optionId')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  removeOption(@Param('productId') productId: string, @Param('optionId') optionId: string) {
    return this.optionService.remove(productId, optionId);
  }

  // Product Variants
  @Get(':productId/variants')
  @Permissions(PERMISSIONS.PRODUCT.READ)
  findAllVariants(@Param('productId') productId: string) {
    return this.variantService.findAll(productId);
  }

  @Post(':productId/variants')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  createVariant(@Param('productId') productId: string, @Body() dto: CreateProductVariantDto) {
    return this.variantService.create(productId, dto);
  }

  @Get(':productId/variants/:variantId')
  @Permissions(PERMISSIONS.PRODUCT.READ)
  findOneVariant(@Param('productId') productId: string, @Param('variantId') variantId: string) {
    return this.variantService.findOne(productId, variantId);
  }

  @Patch(':productId/variants/:variantId')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.variantService.update(productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  @Permissions(PERMISSIONS.PRODUCT.UPDATE)
  removeVariant(@Param('productId') productId: string, @Param('variantId') variantId: string) {
    return this.variantService.remove(productId, variantId);
  }
}
