import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { QueryShippingDestinationDto, ShippingQuoteDto } from './dto';
import { ShippingService } from './shipping.service';

@Controller('public/shipping')
@UseGuards(ClerkAuthGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('destinations')
  findDestinations(@Query() query: QueryShippingDestinationDto) {
    return this.shippingService.findDestinations(query);
  }

  @Post('quote')
  async quote(@Body() dto: ShippingQuoteDto) {
    const quotes = await this.shippingService.quote(dto);
    return { data: quotes };
  }
}
