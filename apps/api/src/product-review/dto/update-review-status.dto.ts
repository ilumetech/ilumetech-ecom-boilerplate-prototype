import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class UpdateReviewStatusDto {
  @IsNotEmpty()
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}
