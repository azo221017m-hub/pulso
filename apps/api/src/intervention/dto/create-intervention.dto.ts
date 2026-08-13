import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInterventionDto {
  @IsOptional()
  @IsString()
  notificationId?: string;

  @IsOptional()
  @IsString()
  cravingEventId?: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  durationSeconds?: number;
}
