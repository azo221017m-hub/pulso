import { IsInt, IsString, Max, Min } from 'class-validator';

export class StartSessionDto {
  @IsString()
  emocionInicialId: string;

  @IsInt()
  @Min(0)
  @Max(10)
  intensidadInicial: number;
}
