import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ClerkUser } from '../common/types/clerk.types';
import { ProductReviewService } from './product-review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('public')
export class PublicProductReviewController {
  constructor(private readonly reviewService: ProductReviewService) {}

  @Get('products/:productId/reviews')
  async getProductReviews(@Param('productId') productId: string) {
    const res = await this.reviewService.getProductReviews(productId);
    return { data: res };
  }

  @Post('reviews')
  @UseGuards(ClerkAuthGuard)
  async submitReview(
    @CurrentUser() user: ClerkUser,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewService.submit(user.sub, dto);
    return { data: review };
  }
}
