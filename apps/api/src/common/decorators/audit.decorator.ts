import { SetMetadata } from '@nestjs/common';
import type { AuditCategory } from '@prisma/client';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  entityType: string;
  category: AuditCategory;
}

export const Audit = (entityType: string, category: AuditCategory) =>
  SetMetadata(AUDIT_KEY, { entityType, category });
