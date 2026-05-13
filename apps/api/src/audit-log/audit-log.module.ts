import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { PermissionsGuard } from '../common/guards';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, PermissionsGuard],
})
export class AuditLogModule {}
