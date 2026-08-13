import { StrategyType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateStrategyUsageDto {
  @IsEnum(StrategyType)
  strategy: StrategyType;

  @IsOptional()
  @IsString()
  cravingEventId?: string;

  @IsOptional()
  @IsBoolean()
  succeeded?: boolean;
}
