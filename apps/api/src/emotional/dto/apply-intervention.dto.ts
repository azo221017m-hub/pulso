import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ApplyInterventionDto {
  @IsString()
  intervencionId: string;

  @IsInt()
  @Min(0)
  @Max(10)
  intensidadAntes: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  intensidadDespues?: number;

  @IsOptional()
  @IsString()
  resultado?: string;
}
