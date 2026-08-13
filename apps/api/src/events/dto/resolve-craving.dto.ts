import { CravingOutcome, StrategyType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class ResolveCravingDto {
  @IsEnum(CravingOutcome)
  outcome: CravingOutcome;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsEnum(StrategyType)
  strategy?: StrategyType;

  @IsOptional()
  @IsBoolean()
  strategySucceeded?: boolean;
}
