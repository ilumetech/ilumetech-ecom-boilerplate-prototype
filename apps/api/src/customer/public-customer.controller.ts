import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ClerkUser } from '../common/types/clerk.types';
import { CustomerService } from './customer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('public/customers')
@UseGuards(ClerkAuthGuard)
export class PublicCustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: ClerkUser) {
    return this.customerService.findOne(user.sub);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: ClerkUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.customerService.update(user.sub, dto);
  }
}
