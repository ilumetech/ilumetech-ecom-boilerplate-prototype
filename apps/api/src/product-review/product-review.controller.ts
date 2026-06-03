import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@ilumetech/types';
import { ProductReviewService } from './product-review.service';
import { QueryReviewDto } from './dto/query-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Controller('reviews')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
export class ProductReviewController {
  constructor(private readonly reviewService: ProductReviewService) {}

  @Get()
  @Permissions(PERMISSIONS.PRODUCT_REVIEW.READ)
  async findAll(@Query() query: QueryReviewDto) {
    return this.reviewService.findAll(query);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.PRODUCT_REVIEW.UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    const review = await this.reviewService.updateStatus(id, dto.status);
    return { data: review };
  }
}
