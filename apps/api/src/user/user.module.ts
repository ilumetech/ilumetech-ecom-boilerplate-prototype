import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, PermissionsGuard],
})
export class UserModule {}
