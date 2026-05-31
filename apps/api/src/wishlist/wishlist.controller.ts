import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ClerkUser } from '../common/types/clerk.types';
import { WishlistService } from './wishlist.service';
import { IsNotEmpty, IsString } from 'class-validator';

class ToggleWishlistDto {
  @IsNotEmpty()
  @IsString()
  productId: string;
}

@Controller('public/wishlist')
@UseGuards(ClerkAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentUser() user: ClerkUser) {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post('toggle')
  async toggleWishlist(
    @CurrentUser() user: ClerkUser,
    @Body() dto: ToggleWishlistDto,
  ) {
    const res = await this.wishlistService.toggle(user.sub, dto.productId);
    return { data: res };
  }
}
