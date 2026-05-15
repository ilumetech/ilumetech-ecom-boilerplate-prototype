import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, PermissionsGuard } from '../common/guards';
import { Permissions } from '../common/decorators';
import { PERMISSIONS } from '../common/constants';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto';

@Controller('audit-logs')
@UseGuards(ClerkAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT_LOG.READ)
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}
