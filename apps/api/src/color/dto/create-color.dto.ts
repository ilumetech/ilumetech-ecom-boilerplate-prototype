import { IsString } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;
}
