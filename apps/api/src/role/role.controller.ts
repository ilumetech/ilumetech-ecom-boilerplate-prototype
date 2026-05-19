import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@ilumetech/types';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Controller('roles')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permissions(PERMISSIONS.ROLE.READ)
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ROLE.READ)
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.ROLE.CREATE)
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.ROLE.UPDATE)
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.roleService.updatePermissions(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.ROLE.DELETE)
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
