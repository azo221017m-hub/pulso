import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FinalizeSessionDto {
  @IsInt()
  @Min(0)
  @Max(10)
  intensidadFinal: number;

  @IsOptional()
  @IsString()
  emocionFinalId?: string;
}
