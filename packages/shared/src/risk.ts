import { RiskBand } from './enums';

/**
 * The 8 named risk components from the INTUICIÓN PULSO spec. Every
 * consumer (API, mobile debug views, future ML layer) should read these
 * exact keys so the score stays explainable end to end.
 */
export interface RiskBreakdown {
  timeRisk: number;
  dayRisk: number;
  frequencyRisk: number;
  triggerRisk: number;
  recentCravingRisk: number;
  recentRelapseRisk: number;
  smokingIntervalRisk: number;
  historicalPatternRisk: number;
}

export type RiskWeights = RiskBreakdown;

export type RiskConfidence = 'GENERIC' | 'BLENDED' | 'PERSONALIZED';

export interface RiskAssessment {
  userId: string;
  riskScore: number;
  band: RiskBand;
  breakdown: RiskBreakdown;
  weights: RiskWeights;
  confidence: RiskConfidence;
  computedAt: string;
}

export function bandForScore(score: number): RiskBand {
  if (score >= 80) return RiskBand.VERY_HIGH;
  if (score >= 60) return RiskBand.HIGH;
  if (score >= 30) return RiskBand.MODERATE;
  return RiskBand.LOW;
}
