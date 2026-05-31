import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QueryDto } from '../../common/dto/query.dto';
import { ReviewStatus } from '@prisma/client';

export class QueryReviewDto extends QueryDto {
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  productId?: string;
}
