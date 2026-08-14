import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class ActivateTsq8Dto {
  @IsOptional()
  @IsLatitude()
  latitud?: number;

  @IsOptional()
  @IsLongitude()
  longitud?: number;

  @IsOptional()
  @IsString()
  sesionId?: string;
}
