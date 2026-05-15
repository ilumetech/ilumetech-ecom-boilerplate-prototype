import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Audit, GetCurrentUser, Permissions } from '../common/decorators';
import { PERMISSIONS } from '@ilumetech/types';
import { UserService } from './user.service';
import { AssignRoleDto, InviteUserDto, UpdateUserDto, UserQueryDto } from './dto';

@Controller('users')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
@Audit('user', AuditCategory.OPERATIONAL)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions(PERMISSIONS.USER.READ)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @Audit('user', AuditCategory.OPERATIONAL)
  findMe(@GetCurrentUser() clerkUserId: string) {
    return this.userService.findMe(clerkUserId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USER.READ)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post('invite')
  @Permissions(PERMISSIONS.USER.INVITE)
  create(@Body() dto: InviteUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.USER.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.USER.DELETE)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Get(':id/roles')
  @Permissions(PERMISSIONS.USER.READ)
  getUserRoles(@Param('id') id: string) {
    return this.userService.getUserRoles(id);
  }

  @Post(':id/roles')
  @Permissions(PERMISSIONS.USER.UPDATE)
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.userService.assignRole(id, dto);
  }

  @Delete(':id/roles/:roleId')
  @Permissions(PERMISSIONS.USER.UPDATE)
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.userService.removeRole(id, roleId);
  }
}
