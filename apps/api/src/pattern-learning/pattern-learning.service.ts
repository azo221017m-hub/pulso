import { Injectable } from '@nestjs/common';
import { CravingOutcome } from '@prisma/client';
import { getLocalDayOfWeek, getLocalHour } from '@pulso/shared';
import { PrismaService } from '../prisma/prisma.service';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Rebuilds a user's UserRiskProfile from their full event history. A from-scratch recompute
 * (rather than incremental deltas) keeps the histograms provably correct and explainable —
 * at MVP data volumes the cost is negligible, and it's the safer choice for a system whose
 * whole premise is "trust the numbers it shows you".
 */
@Injectable()
export class PatternLearningService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeUserRiskProfile(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const [cravingEvents, smokingEvents, strategyUsages] = await Promise.all([
      this.prisma.cravingEvent.findMany({ where: { userId }, orderBy: { occurredAt: 'asc' } }),
      this.prisma.smokingEvent.findMany({ where: { userId }, orderBy: { occurredAt: 'asc' } }),
      this.prisma.strategyUsage.findMany({ where: { userId } }),
    ]);

    const hourHistogram: Record<string, number> = {};
    const dayOfWeekHistogram: Record<string, number> = {};
    for (let h = 0; h < 24; h++) hourHistogram[h] = 0;
    for (let d = 0; d < 7; d++) dayOfWeekHistogram[d] = 0;

    for (const event of [...cravingEvents, ...smokingEvents]) {
      const hour = getLocalHour(event.occurredAt, user.timezone);
      const day = getLocalDayOfWeek(event.occurredAt, user.timezone);
      hourHistogram[hour] += 1;
      dayOfWeekHistogram[day] += 1;
    }

    const triggerFrequency: Record<string, number> = {};
    for (const event of cravingEvents) {
      for (const trigger of event.triggers) {
        triggerFrequency[trigger] = (triggerFrequency[trigger] ?? 0) + 1;
      }
    }

    const strategySuccessRate: Record<string, { used: number; succeeded: number }> = {};
    for (const usage of strategyUsages) {
      const bucket = (strategySuccessRate[usage.strategy] ??= { used: 0, succeeded: 0 });
      bucket.used += 1;
      if (usage.succeeded) bucket.succeeded += 1;
    }

    let avgIntervalMinutes: number | null = null;
    if (smokingEvents.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < smokingEvents.length; i++) {
        const gapMinutes =
          (smokingEvents[i].occurredAt.getTime() - smokingEvents[i - 1].occurredAt.getTime()) / 60_000;
        if (gapMinutes > 0) gaps.push(gapMinutes);
      }
      if (gaps.length > 0) avgIntervalMinutes = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    }

    const now = Date.now();
    const recentCravingCount7d = cravingEvents.filter(
      (e) => now - e.occurredAt.getTime() <= SEVEN_DAYS_MS,
    ).length;
    const recentRelapseCount7d = cravingEvents.filter(
      (e) => e.outcome === CravingOutcome.SMOKED && now - e.occurredAt.getTime() <= SEVEN_DAYS_MS,
    ).length;

    const lastSmokedAt = smokingEvents.at(-1)?.occurredAt ?? null;
    const lastCravingAt = cravingEvents.at(-1)?.occurredAt ?? null;
    const sampleSize = cravingEvents.length + smokingEvents.length;

    await this.prisma.userRiskProfile.upsert({
      where: { userId },
      create: {
        userId,
        hourHistogram,
        dayOfWeekHistogram,
        triggerFrequency,
        strategySuccessRate,
        avgIntervalMinutes,
        lastSmokedAt,
        lastCravingAt,
        recentCravingCount7d,
        recentRelapseCount7d,
        sampleSize,
      },
      update: {
        hourHistogram,
        dayOfWeekHistogram,
        triggerFrequency,
        strategySuccessRate,
        avgIntervalMinutes,
        lastSmokedAt,
        lastCravingAt,
        recentCravingCount7d,
        recentRelapseCount7d,
        sampleSize,
      },
    });
  }
}
