/**
 * "Cerebro emocional" — pure functions shared by API and mobile for PULSO Emocional. The color
 * palette is a PULSO visualization convention inspired by neuroscience imagery, not a real
 * measurement of brain activity — see EMOTIONAL_BRAIN_DISCLAIMER (spec §25-26).
 */

export type EmotionalColorKey = 'azul' | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'morado';

export const EMOTIONAL_BRAIN_DISCLAIMER =
  'PULSO representa tu estado emocional actual con una intensidad de color. Esta visualización no mide tu actividad neurológica real.';

export const EMOTIONAL_COLOR_HEX: Record<EmotionalColorKey, string> = {
  azul: '#3B82C4',
  verde: '#4C9A6A',
  amarillo: '#C9971F',
  naranja: '#D97B3F',
  rojo: '#C24545',
  morado: '#8B5FA8',
};

/** Spec §31 — shown in "¿Qué significan los colores?". */
export const EMOTIONAL_COLOR_EXPLANATIONS: Record<EmotionalColorKey, string> = {
  verde: 'Tu estado parece estar relativamente estable.',
  amarillo: 'Hay una emoción que merece atención.',
  naranja: 'La emoción está aumentando. Puede ser buen momento para hacer una pausa.',
  rojo: 'La intensidad es alta. Prioriza tu seguridad y considera pedir apoyo.',
  azul: 'Estado asociado a calma o baja activación.',
  morado: 'Estado emocional complejo — vale la pena darte un momento para explorarlo.',
};

/** Umbrales de nivel interno de PULSO (spec §20) — no son un diagnóstico clínico. */
export interface NivelEmocionalInterno {
  nivel: 1 | 2 | 3 | 4;
  nombre: string;
  color: EmotionalColorKey;
  intensidadMinima: number;
  intensidadMaxima: number;
}

export const NIVELES_EMOCIONALES: NivelEmocionalInterno[] = [
  { nivel: 1, nombre: 'Estable', color: 'verde', intensidadMinima: 0, intensidadMaxima: 3 },
  { nivel: 2, nombre: 'Atención', color: 'amarillo', intensidadMinima: 4, intensidadMaxima: 6 },
  { nivel: 3, nombre: 'Alta intensidad', color: 'naranja', intensidadMinima: 7, intensidadMaxima: 8 },
  { nivel: 4, nombre: 'Crítico', color: 'rojo', intensidadMinima: 9, intensidadMaxima: 10 },
];

/** Mirror cliente-side de los mismos umbrales que usa el backend — evita un round-trip solo para previsualizar el color mientras el usuario mueve el slider de intensidad. */
export function nivelInternoParaIntensidad(intensidad: number): NivelEmocionalInterno {
  const clamped = Math.max(0, Math.min(10, intensidad));
  return (
    NIVELES_EMOCIONALES.find((n) => clamped >= n.intensidadMinima && clamped <= n.intensidadMaxima) ??
    NIVELES_EMOCIONALES[0]
  );
}

export interface EmotionalBrainVisualState {
  fillColor: string;
  /** 0 (quieto) - 1 (muy activo) — impulsa la amplitud/velocidad de la animación de pulso. */
  activation: number;
  pulseSpeedMs: number;
}

/**
 * `colorKey` viene del nivel de intensidad actual (o del `colorBase` de la emoción cuando no hay
 * sesión activa). El nivel (1-4) controla qué tan intensa se ve la animación — spec §27.
 */
export function getEmotionalVisualState(colorKey: EmotionalColorKey, nivel: 1 | 2 | 3 | 4 = 1): EmotionalBrainVisualState {
  const activation = (nivel - 1) / 3;
  return {
    fillColor: EMOTIONAL_COLOR_HEX[colorKey],
    activation,
    pulseSpeedMs: Math.round(2600 - activation * 1600),
  };
}
