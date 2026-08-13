import { TriggerType } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCravingDto {
  @IsInt()
  @Min(1)
  @Max(10)
  intensity: number;

  @IsOptional()
  @IsArray()
  @IsEnum(TriggerType, { each: true })
  triggers?: TriggerType[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  /** Set when this log resulted from tapping a predictive notification (spec §15-16). */
  @IsOptional()
  @IsString()
  sourceNotificationId?: string;
}
