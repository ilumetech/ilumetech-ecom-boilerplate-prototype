import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductOptionValueDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

export class CreateProductOptionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionValueDto)
  values?: CreateProductOptionValueDto[];
}

export class UpdateProductOptionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
