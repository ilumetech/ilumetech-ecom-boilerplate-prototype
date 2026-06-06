import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderTrackingDto {
  @IsOptional()
  @IsString()
  shippingCourier?: string;

  @IsOptional()
  @IsString()
  trackingCode?: string;
}
