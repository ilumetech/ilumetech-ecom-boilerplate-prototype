import { SetMetadata } from '@nestjs/common';

export const SENSITIVE_FIELDS_KEY = 'sensitiveFields';

export const SensitiveFields = (fieldPermissions: Record<string, string>) =>
  SetMetadata(SENSITIVE_FIELDS_KEY, fieldPermissions);
