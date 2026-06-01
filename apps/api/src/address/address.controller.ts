import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ClerkUser } from '../common/types/clerk.types';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Controller('public/addresses')
@UseGuards(ClerkAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async create(@CurrentUser() user: ClerkUser, @Body() dto: CreateAddressDto) {
    const address = await this.addressService.create(user.sub, dto);
    return { data: address };
  }

  @Get()
  async findAll(@CurrentUser() user: ClerkUser) {
    const addresses = await this.addressService.findAll(user.sub);
    return { data: addresses };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const address = await this.addressService.findOne(id, user.sub);
    return { data: address };
  }

  @Put(':id')
  async update(
    @CurrentUser() user: ClerkUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const address = await this.addressService.update(id, user.sub, dto);
    return { data: address };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const address = await this.addressService.remove(id, user.sub);
    return { data: address };
  }

  @Patch(':id/default')
  async setDefault(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    const address = await this.addressService.setDefault(id, user.sub);
    return { data: address };
  }
}
