import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  productCategoryId: string;

  @IsString()
  unitId: string;

  @IsNumber()
  @Type(() => Number)
  sellingPrice: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
