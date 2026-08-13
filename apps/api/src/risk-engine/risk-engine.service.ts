import { Injectable } from '@nestjs/common';
import { CravingOutcome } from '@prisma/client';
import { RiskAssessment } from '@pulso/shared';
import { getLocalHour } from '@pulso/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RISK_WEIGHTS } from '../config/risk.config';
import { calculateRiskScore, RiskProfileInput, TriggerStat } from './risk-calculator';

const NEAR_HOUR_WINDOW = 1;

@Injectable()
export class RiskEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async assessUser(userId: string, options?: { activeTriggers?: string[]; now?: Date }): Promise<RiskAssessment> {
    const now = options?.now ?? new Date();
    const [user, profile, cravingEvents] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.userRiskProfile.findUniqueOrThrow({ where: { userId } }),
      this.prisma.cravingEvent.findMany({
        where: { userId },
        select: { occurredAt: true, outcome: true, triggers: true },
      }),
    ]);

    const triggerStats: Record<string, TriggerStat> = {};
    for (const event of cravingEvents) {
      for (const trigger of event.triggers) {
        const stat = (triggerStats[trigger] ??= { total: 0, smoked: 0 });
        stat.total += 1;
        if (event.outcome === CravingOutcome.SMOKED) stat.smoked += 1;
      }
    }

    const currentHour = getLocalHour(now, user.timezone);
    const nearHourSamples = cravingEvents
      .map((event) => ({
        hour: getLocalHour(event.occurredAt, user.timezone),
        smoked: event.outcome === CravingOutcome.SMOKED,
      }))
      .filter((e) => circularHourDistance(e.hour, currentHour) <= NEAR_HOUR_WINDOW)
      .map((e) => ({ smoked: e.smoked }));

    const profileInput: RiskProfileInput = {
      hourHistogram: profile.hourHistogram as Record<string, number>,
      dayOfWeekHistogram: profile.dayOfWeekHistogram as Record<string, number>,
      triggerFrequency: profile.triggerFrequency as Record<string, number>,
      avgIntervalMinutes: profile.avgIntervalMinutes,
      lastSmokedAt: profile.lastSmokedAt,
      recentCravingCount7d: profile.recentCravingCount7d,
      recentRelapseCount7d: profile.recentRelapseCount7d,
      sampleSize: profile.sampleSize,
    };

    return calculateRiskScore(userId, profileInput, {
      now,
      timezone: user.timezone,
      weights: RISK_WEIGHTS,
      triggerStats,
      nearHourSamples,
      activeTriggers: options?.activeTriggers,
    });
  }
}

function circularHourDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 24 - diff);
}
