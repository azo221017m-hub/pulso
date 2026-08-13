import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  quitMotivation?: string;

  @IsOptional()
  @IsDateString()
  quitDate?: string;
}
