import {
  bandForScore,
  getLocalDayOfWeek,
  getLocalHour,
  minutesBetween,
  RiskAssessment,
  RiskConfidence,
  RiskWeights,
} from '@pulso/shared';
import {
  DEFAULT_SMOKING_INTERVAL_MINUTES,
  GENERIC_DAY_RISK_CURVE,
  GENERIC_HOUR_RISK_CURVE,
  HISTORICAL_PATTERN_MIN_SAMPLES,
  RISK_CONFIDENCE_THRESHOLDS,
} from '../config/risk.config';

export interface RiskProfileInput {
  hourHistogram: Record<string, number>;
  dayOfWeekHistogram: Record<string, number>;
  triggerFrequency: Record<string, number>;
  avgIntervalMinutes: number | null;
  lastSmokedAt: Date | null;
  recentCravingCount7d: number;
  recentRelapseCount7d: number;
  sampleSize: number;
}

/** Historical occurrence-rate signal, computed by the caller from raw CravingEvents. */
export interface TriggerStat {
  total: number;
  smoked: number;
}

export interface RiskCalculatorContext {
  now: Date;
  timezone: string;
  weights: RiskWeights;
  /** Per-trigger historical outcome rates, keyed by TriggerType. */
  triggerStats: Record<string, TriggerStat>;
  /** Whether each historical craving within ±1h of the current local hour ended in smoking. */
  nearHourSamples: { smoked: boolean }[];
  /**
   * Present only when re-scoring immediately after the user logs a craving with explicit
   * triggers — switches triggerRisk from passive (dominant-trigger baseline) to active
   * (outcome rate for these specific triggers) mode. Absent on a background cron tick, which
   * has no live trigger signal to react to.
   */
  activeTriggers?: string[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + b, 0);
}

function personalWeightFor(sampleSize: number): number {
  return Math.min(1, sampleSize / 50);
}

function computeTimeRisk(profile: RiskProfileInput, now: Date, timezone: string): number {
  const currentHour = getLocalHour(now, timezone);
  const maxHourCount = Math.max(1, ...Object.values(profile.hourHistogram).map(Number));
  const personalHourScore =
    sumValues(profile.hourHistogram) > 0
      ? ((profile.hourHistogram[currentHour] ?? 0) / maxHourCount) * 100
      : 0;
  const genericHourScore = GENERIC_HOUR_RISK_CURVE[currentHour];
  const weight = personalWeightFor(profile.sampleSize);
  return clamp(weight * personalHourScore + (1 - weight) * genericHourScore);
}

function computeDayRisk(profile: RiskProfileInput, now: Date, timezone: string): number {
  const currentDay = getLocalDayOfWeek(now, timezone);
  const maxDayCount = Math.max(1, ...Object.values(profile.dayOfWeekHistogram).map(Number));
  const personalDayScore =
    sumValues(profile.dayOfWeekHistogram) > 0
      ? ((profile.dayOfWeekHistogram[currentDay] ?? 0) / maxDayCount) * 100
      : 0;
  const genericDayScore = GENERIC_DAY_RISK_CURVE[currentDay];
  const weight = personalWeightFor(profile.sampleSize);
  return clamp(weight * personalDayScore + (1 - weight) * genericDayScore);
}

function computeFrequencyRisk(profile: RiskProfileInput): number {
  const baselineEventsPerDay = profile.avgIntervalMinutes
    ? 1440 / profile.avgIntervalMinutes
    : profile.recentCravingCount7d / 7;
  return clamp(baselineEventsPerDay * 10);
}

function computeTriggerRisk(profile: RiskProfileInput, ctx: RiskCalculatorContext): number {
  if (ctx.activeTriggers && ctx.activeTriggers.length > 0) {
    const rates = ctx.activeTriggers.map((trigger) => {
      const stat = ctx.triggerStats[trigger];
      return stat && stat.total > 0 ? (stat.smoked / stat.total) * 100 : 40;
    });
    return clamp(rates.reduce((a, b) => a + b, 0) / rates.length);
  }

  const total = sumValues(profile.triggerFrequency);
  if (total === 0) return 20;
  const dominant = Math.max(...Object.values(profile.triggerFrequency).map(Number));
  const share = dominant / total;
  return clamp(share * 70);
}

function computeRecentCravingRisk(profile: RiskProfileInput): number {
  return clamp(profile.recentCravingCount7d * 12);
}

function computeRecentRelapseRisk(profile: RiskProfileInput): number {
  return clamp(profile.recentRelapseCount7d * 20);
}

function computeSmokingIntervalRisk(profile: RiskProfileInput, now: Date): number {
  const effectiveAvg = profile.avgIntervalMinutes ?? DEFAULT_SMOKING_INTERVAL_MINUTES;
  const minutesSinceLastSmoke = profile.lastSmokedAt
    ? minutesBetween(now, profile.lastSmokedAt)
    : effectiveAvg;
  const ratio = minutesSinceLastSmoke / effectiveAvg;
  const raw = clamp(ratio * 100);
  // Reduced confidence when we're falling back to the generic baseline (no personal average yet).
  return profile.avgIntervalMinutes ? raw : clamp(raw * 0.7 + 15);
}

function computeHistoricalPatternRisk(ctx: RiskCalculatorContext): number {
  if (ctx.nearHourSamples.length < HISTORICAL_PATTERN_MIN_SAMPLES) return 40;
  const smokedCount = ctx.nearHourSamples.filter((s) => s.smoked).length;
  return clamp((smokedCount / ctx.nearHourSamples.length) * 100);
}

function confidenceFor(sampleSize: number): RiskConfidence {
  if (sampleSize >= RISK_CONFIDENCE_THRESHOLDS.personalized) return 'PERSONALIZED';
  if (sampleSize >= RISK_CONFIDENCE_THRESHOLDS.blended) return 'BLENDED';
  return 'GENERIC';
}

/**
 * Pure risk calculator — no DB access, unit-testable with fixtures. This is the seam a future
 * ML/prediction layer can replace without touching any caller, as long as it keeps returning
 * a RiskAssessment shaped exactly like this one.
 */
export function calculateRiskScore(
  userId: string,
  profile: RiskProfileInput,
  ctx: RiskCalculatorContext,
): RiskAssessment {
  const breakdown = {
    timeRisk: computeTimeRisk(profile, ctx.now, ctx.timezone),
    dayRisk: computeDayRisk(profile, ctx.now, ctx.timezone),
    frequencyRisk: computeFrequencyRisk(profile),
    triggerRisk: computeTriggerRisk(profile, ctx),
    recentCravingRisk: computeRecentCravingRisk(profile),
    recentRelapseRisk: computeRecentRelapseRisk(profile),
    smokingIntervalRisk: computeSmokingIntervalRisk(profile, ctx.now),
    historicalPatternRisk: computeHistoricalPatternRisk(ctx),
  };

  const riskScore = Math.round(
    Object.entries(breakdown).reduce(
      (total, [key, value]) => total + value * ctx.weights[key as keyof RiskWeights],
      0,
    ),
  );

  return {
    userId,
    riskScore: clamp(riskScore),
    band: bandForScore(clamp(riskScore)),
    breakdown,
    weights: ctx.weights,
    confidence: confidenceFor(profile.sampleSize),
    computedAt: ctx.now.toISOString(),
  };
}
