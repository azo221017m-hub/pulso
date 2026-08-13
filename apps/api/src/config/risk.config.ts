import { RiskWeights } from '@pulso/shared';

/**
 * Weights for the 8 named risk components. Kept as one exported const so they're easy to
 * retune without hunting through the engine — the spec calls this out explicitly ("los pesos
 * deben poder modificarse fácilmente"). Must sum to 1.0.
 */
export const RISK_WEIGHTS: RiskWeights = {
  timeRisk: 0.2,
  dayRisk: 0.1,
  frequencyRisk: 0.1,
  triggerRisk: 0.1,
  recentCravingRisk: 0.15,
  recentRelapseRisk: 0.15,
  smokingIntervalRisk: 0.15,
  historicalPatternRisk: 0.05,
};

export const RISK_BANDS = {
  LOW: [0, 29],
  MODERATE: [30, 59],
  HIGH: [60, 79],
  VERY_HIGH: [80, 100],
} as const;

/** Sample size thresholds that drive the GENERIC -> BLENDED -> PERSONALIZED confidence label. */
export const RISK_CONFIDENCE_THRESHOLDS = {
  blended: 10,
  personalized: 50,
};

/** How many recent historical events must fall in the ±1h window for historicalPatternRisk to be trusted. */
export const HISTORICAL_PATTERN_MIN_SAMPLES = 3;

/** Fallback average interval (minutes) used for smokingIntervalRisk before we have real per-user data. */
export const DEFAULT_SMOKING_INTERVAL_MINUTES = 180;

/**
 * Generic (population-level) hourly risk prior, used before/alongside personal data.
 * Peaks after typical meal times and in the early evening, per spec §4's example
 * ("los momentos después de comer suelen ser un detonante frecuente").
 */
export const GENERIC_HOUR_RISK_CURVE: number[] = [
  10, 8, 5, 5, 5, 5, // 0-5
  10, 20, 25, 20, 15, 20, // 6-11
  55, 60, 30, 25, 30, 35, // 12-17 (lunch spike at 12-13)
  70, 75, 65, 45, 30, 20, // 18-23 (evening spike at 18-19)
];

export const GENERIC_DAY_RISK_CURVE: number[] = [
  // Sun .. Sat — weekends slightly elevated (social/alcohol contexts)
  55, 45, 45, 45, 50, 55, 65,
];
