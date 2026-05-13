import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuditCategory } from '@prisma/client';
import { QueryDto } from '../../common/dto';

export class QueryAuditLogDto extends QueryDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;
}
