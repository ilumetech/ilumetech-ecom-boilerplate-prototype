import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountMode, DiscountType } from '@prisma/client';

export class CreateProductVariantDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  finalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compareAtPrice?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountValue?: number | null;

  @IsOptional()
  @IsEnum(DiscountMode)
  discountMode?: DiscountMode | null;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionValueIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tempOptionValueIds?: string[];
}

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  finalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compareAtPrice?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountValue?: number | null;

  @IsOptional()
  @IsEnum(DiscountMode)
  discountMode?: DiscountMode | null;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionValueIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tempOptionValueIds?: string[];
}
