import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StockMovementType, StockReferenceType } from '@prisma/client';
import { QueryDto } from '../../common/dto';

export class StockMovementQueryDto extends QueryDto {
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @IsOptional()
  @IsEnum(StockReferenceType)
  referenceType?: StockReferenceType;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
