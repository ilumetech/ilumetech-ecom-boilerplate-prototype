import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [RoleController],
  providers: [RoleService, PermissionsGuard],
})
export class RoleModule {}
