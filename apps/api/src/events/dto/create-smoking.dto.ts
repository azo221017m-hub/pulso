import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSmokingDto {
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  cravingEventId?: string;
}
