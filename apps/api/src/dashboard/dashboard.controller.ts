import { Controller, Get, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@ilumetech/types';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Permissions } from '../common/decorators';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('user-stats')
  @Permissions(PERMISSIONS.DASHBOARD.VIEW_USER_STATS)
  getUserStats() {
    return this.dashboardService.getUserStats();
  }

  @Get('product-stats')
  @Permissions(PERMISSIONS.DASHBOARD.VIEW_PRODUCT_STATS)
  getProductStats() {
    return this.dashboardService.getProductStats();
  }

  @Get('category-stats')
  @Permissions(PERMISSIONS.DASHBOARD.VIEW_CATEGORY_STATS)
  getCategoryStats() {
    return this.dashboardService.getCategoryStats();
  }
}
