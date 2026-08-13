import { RISK_WEIGHTS } from '../config/risk.config';
import { calculateRiskScore, RiskCalculatorContext, RiskProfileInput } from './risk-calculator';

const NOW = new Date('2026-08-12T18:40:00Z'); // Wednesday
const TIMEZONE = 'UTC';

function emptyHistogram(size: number): Record<string, number> {
  const h: Record<string, number> = {};
  for (let i = 0; i < size; i++) h[i] = 0;
  return h;
}

function baseProfile(overrides: Partial<RiskProfileInput> = {}): RiskProfileInput {
  return {
    hourHistogram: emptyHistogram(24),
    dayOfWeekHistogram: emptyHistogram(7),
    triggerFrequency: {},
    avgIntervalMinutes: null,
    lastSmokedAt: null,
    recentCravingCount7d: 0,
    recentRelapseCount7d: 0,
    sampleSize: 0,
    ...overrides,
  };
}

function baseContext(overrides: Partial<RiskCalculatorContext> = {}): RiskCalculatorContext {
  return {
    now: NOW,
    timezone: TIMEZONE,
    weights: RISK_WEIGHTS,
    triggerStats: {},
    nearHourSamples: [],
    ...overrides,
  };
}

describe('calculateRiskScore', () => {
  it('returns a LOW band for a brand-new user with no history and no recent activity', () => {
    const result = calculateRiskScore('user-1', baseProfile(), baseContext({ now: new Date('2026-08-12T03:00:00Z') }));
    expect(result.band).toBe('LOW');
    expect(result.confidence).toBe('GENERIC');
    expect(result.riskScore).toBeLessThan(30);
  });

  it('returns MODERATE for a user with light recent craving activity during a generically risky hour', () => {
    const profile = baseProfile({
      sampleSize: 5,
      recentCravingCount7d: 3,
    });
    const result = calculateRiskScore('user-2', profile, baseContext({ now: new Date('2026-08-12T18:00:00Z') }));
    expect(result.band).toBe('MODERATE');
  });

  it('returns HIGH when the current hour is a strong personal hotspot with real sample size', () => {
    const hourHistogram = emptyHistogram(24);
    hourHistogram[18] = 20; // dominant hour matches NOW (18:40 UTC)
    const dayHistogram = emptyHistogram(7);
    dayHistogram[3] = 10; // Wednesday
    const profile = baseProfile({
      hourHistogram,
      dayOfWeekHistogram: dayHistogram,
      sampleSize: 55,
      avgIntervalMinutes: 180,
      lastSmokedAt: new Date('2026-08-12T15:40:00Z'), // 3h ago -> past average interval
      recentCravingCount7d: 3,
    });
    const result = calculateRiskScore('user-3', profile, baseContext());
    expect(result.band).toBe('HIGH');
    expect(result.confidence).toBe('PERSONALIZED');
  });

  it('returns VERY_HIGH for the golden-path scenario (18:40, strong hotspot + recent relapse)', () => {
    const hourHistogram = emptyHistogram(24);
    hourHistogram[18] = 25;
    const dayHistogram = emptyHistogram(7);
    dayHistogram[3] = 12;
    const profile = baseProfile({
      hourHistogram,
      dayOfWeekHistogram: dayHistogram,
      sampleSize: 60,
      avgIntervalMinutes: 150,
      lastSmokedAt: new Date('2026-08-12T15:40:00Z'),
      recentCravingCount7d: 6,
      recentRelapseCount7d: 3,
      triggerFrequency: { WORK_BREAK: 18, OTHER: 2 },
    });
    const nearHourSamples = [
      { smoked: true },
      { smoked: true },
      { smoked: true },
      { smoked: false },
    ];
    const result = calculateRiskScore('user-4', profile, baseContext({ nearHourSamples }));
    expect(result.band).toBe('VERY_HIGH');
    expect(result.riskScore).toBeGreaterThanOrEqual(80);
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        timeRisk: expect.any(Number),
        dayRisk: expect.any(Number),
        frequencyRisk: expect.any(Number),
        triggerRisk: expect.any(Number),
        recentCravingRisk: expect.any(Number),
        recentRelapseRisk: expect.any(Number),
        smokingIntervalRisk: expect.any(Number),
        historicalPatternRisk: expect.any(Number),
      }),
    );
  });

  it('switches triggerRisk to active mode when activeTriggers is provided', () => {
    const profile = baseProfile({ sampleSize: 20, triggerFrequency: { STRESS: 10, SOCIAL: 2 } });
    const passive = calculateRiskScore(
      'user-5',
      profile,
      baseContext({ now: new Date('2026-08-12T03:00:00Z') }),
    );
    const active = calculateRiskScore(
      'user-5',
      profile,
      baseContext({
        now: new Date('2026-08-12T03:00:00Z'),
        triggerStats: { STRESS: { total: 10, smoked: 9 } },
        activeTriggers: ['STRESS'],
      }),
    );
    expect(active.breakdown.triggerRisk).toBeGreaterThan(passive.breakdown.triggerRisk);
    expect(active.breakdown.triggerRisk).toBeCloseTo(90, 0);
  });

  it('never fabricates historicalPatternRisk confidence below the minimum sample threshold', () => {
    const profile = baseProfile({ sampleSize: 10 });
    const result = calculateRiskScore(
      'user-6',
      profile,
      baseContext({ nearHourSamples: [{ smoked: true }] }),
    );
    expect(result.breakdown.historicalPatternRisk).toBe(40);
  });

  it('clamps the final score within 0-100 regardless of extreme inputs', () => {
    const profile = baseProfile({
      sampleSize: 200,
      recentCravingCount7d: 50,
      recentRelapseCount7d: 50,
      avgIntervalMinutes: 10,
      lastSmokedAt: new Date('2020-01-01T00:00:00Z'),
    });
    const result = calculateRiskScore(
      'user-7',
      profile,
      baseContext({ nearHourSamples: Array.from({ length: 10 }, () => ({ smoked: true })) }),
    );
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
  });
});
