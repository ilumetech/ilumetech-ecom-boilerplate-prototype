import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { Audit, Permissions } from '../common/decorators';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { ColorService } from './color.service';
import { ColorQueryDto, CreateColorDto, UpdateColorDto } from './dto';

@Controller('colors')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('color', AuditCategory.OPERATIONAL)
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Get()
  @Permissions('color:read')
  findAll(@Query() query: ColorQueryDto) {
    return this.colorService.findAll(query);
  }

  @Get(':id')
  @Permissions('color:read')
  findOne(@Param('id') id: string) {
    return this.colorService.findOne(id);
  }

  @Post()
  @Permissions('color:create')
  create(@Body() dto: CreateColorDto) {
    return this.colorService.create(dto);
  }

  @Patch(':id')
  @Permissions('color:update')
  update(@Param('id') id: string, @Body() dto: UpdateColorDto) {
    return this.colorService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('color:delete')
  remove(@Param('id') id: string) {
    return this.colorService.remove(id);
  }
}
