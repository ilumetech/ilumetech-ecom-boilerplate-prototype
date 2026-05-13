import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  productCategoryId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
