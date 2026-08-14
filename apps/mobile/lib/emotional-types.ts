export interface EmocionDto {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  colorBase: string;
  tecnicasRapidas: string[];
  orden: number;
}

export interface RespuestaEmocionalDto {
  id: string;
  texto: string;
  orden: number;
  nivelRiesgo: 'NINGUNO' | 'ALTO' | 'CRITICO';
}

export interface PreguntaEmocionalDto {
  id: string;
  texto: string;
  tipo: 'SELECCION_UNICA' | 'ESCALA';
  respuestas: RespuestaEmocionalDto[];
}

export interface SesionEmocionalDto {
  id: string;
  emocionInicialId: string;
  intensidadInicial: number;
}

export interface IntervencionDto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'RESPIRACION' | 'PAUSA' | 'GROUNDING' | 'MOVIMIENTO' | 'DISTANCIAMIENTO' | 'DISTRACCION' | 'COMUNICACION' | 'CONTACTO';
  duracionSegundos: number | null;
}

export interface StartSessionResponse {
  sesion: SesionEmocionalDto;
  pregunta: PreguntaEmocionalDto | null;
  done: boolean;
  seguridad: boolean;
  intervencionRecomendada?: IntervencionDto;
}

export interface SubmitAnswerResponse {
  seguridad: boolean;
  mensaje?: string;
  pregunta: PreguntaEmocionalDto | null;
  done: boolean;
  intervencionRecomendada?: IntervencionDto;
}
