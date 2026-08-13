export enum TriggerType {
  STRESS = 'STRESS',
  AFTER_MEAL = 'AFTER_MEAL',
  SOCIAL = 'SOCIAL',
  ALCOHOL = 'ALCOHOL',
  COFFEE = 'COFFEE',
  BOREDOM = 'BOREDOM',
  WORK_BREAK = 'WORK_BREAK',
  ANXIETY = 'ANXIETY',
  OTHER = 'OTHER',
}

export enum StrategyType {
  BREATHING = 'BREATHING',
  WALK = 'WALK',
  DRINK_WATER = 'DRINK_WATER',
  CALL_SOMEONE = 'CALL_SOMEONE',
  DISTRACTION = 'DISTRACTION',
  DELAY_10_MIN = 'DELAY_10_MIN',
  CRAVING_SURF = 'CRAVING_SURF',
  OTHER = 'OTHER',
}

export enum CravingOutcome {
  PENDING = 'PENDING',
  RESISTED = 'RESISTED',
  SMOKED = 'SMOKED',
}

export enum MessageCategory {
  animo = 'animo',
  empatia = 'empatia',
  reflexion = 'reflexion',
  anticipacion = 'anticipacion',
  logro = 'logro',
  resiliencia = 'resiliencia',
  identidad = 'identidad',
  autocontrol = 'autocontrol',
  esperanza = 'esperanza',
  compania = 'compania',
  recordatorio = 'recordatorio',
  intervencion_impulso = 'intervencion_impulso',
  recuperacion_recaida = 'recuperacion_recaida',
}

export enum Tone {
  CALIDO = 'CALIDO',
  CALMADO = 'CALMADO',
  DIRECTO = 'DIRECTO',
  JUGUETON = 'JUGUETON',
  SERIO = 'SERIO',
}

export enum RiskBand {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum NotificationOutcome {
  UNKNOWN = 'UNKNOWN',
  CRAVING_LOGGED = 'CRAVING_LOGGED',
  SMOKED_ANYWAY = 'SMOKED_ANYWAY',
  DID_NOT_SMOKE = 'DID_NOT_SMOKE',
  IGNORED = 'IGNORED',
}

export enum InterventionSessionStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum MoodCheck {
  BETTER = 'BETTER',
  SAME = 'SAME',
  NEED_HELP = 'NEED_HELP',
}

/** 0 = no intervention, 4 = emergency 5-minute accompaniment. */
export type AlertLevel = 0 | 1 | 2 | 3 | 4;
