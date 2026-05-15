import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PermissionsGuard } from '../common/guards';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PermissionsGuard],
})
export class DashboardModule {}
