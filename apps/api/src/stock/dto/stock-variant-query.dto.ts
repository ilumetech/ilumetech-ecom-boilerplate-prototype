import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDto } from '../../common/dto';

export class StockVariantQueryDto extends QueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
