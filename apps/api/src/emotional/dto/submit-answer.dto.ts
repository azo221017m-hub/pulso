import { IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  preguntaId: string;

  @IsString()
  respuestaId: string;
}
