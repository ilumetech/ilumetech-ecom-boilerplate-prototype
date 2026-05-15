import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsHexColor()
  hexCode?: string;
}
