import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { QueryDto } from '../../common/dto';

export class QueryProductDto extends QueryDto {
  @IsOptional()
  @IsString()
  productCategoryId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}
