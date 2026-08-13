import { InterventionSessionStatus, MoodCheck } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class CompleteInterventionDto {
  @IsOptional()
  @IsEnum(MoodCheck)
  moodCheck?: MoodCheck;

  @IsOptional()
  @IsEnum(InterventionSessionStatus)
  status?: InterventionSessionStatus;
}
