import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  usageLimit?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
