import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { QueryDto } from '../../common/dto';

export class UserQueryDto extends QueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
