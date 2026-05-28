import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { QueryProductDto } from './dto';

@Controller('public/products')
export class PublicProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findPublicAll(query);
  }

  @Get('colors')
  findPublicColors() {
    return this.productService.findPublicColors();
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productService.findPublicBySlug(slug);
  }
}
