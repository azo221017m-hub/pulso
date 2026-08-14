import { Injectable } from '@nestjs/common';
import { CravingOutcome, TriggerType } from '@prisma/client';
import {
  DashboardMetrics,
  InsightsResponse,
  LungProgressResponse,
  LungProgressWeek,
  TodayLungState,
  DEFAULT_CIGARETTES_PER_DAY,
  MEDICAL_DISCLAIMER,
  getLungVisualState,
  getWeekMessage,
  unlockedMilestones,
} from '@pulso/shared';
import { PrismaService } from '../prisma/prisma.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_HOUR_SAMPLES_FOR_INSIGHT = 4;
const MIN_TRIGGER_SAMPLES_FOR_INSIGHT = 3;
const MIN_STRATEGY_USES_FOR_INSIGHT = 3;
const MIN_STRATEGY_SUCCESS_RATE_FOR_INSIGHT = 0.6;
/** Lookback window used to estimate the user's pre-quit daily cigarette rate. */
const BASELINE_WINDOW_DAYS = 14;
const MIN_BASELINE_EVENTS = 3;
/** Safety bound on how many weekly buckets the timeline will ever compute. */
const MAX_TIMELINE_WEEKS = 104;

const TRIGGER_PHRASES: Record<TriggerType, string> = {
  STRESS: 'los momentos de estrés',
  AFTER_MEAL: 'los momentos después de comer',
  SOCIAL: 'las situaciones sociales',
  ALCOHOL: 'los momentos en los que hay alcohol de por medio',
  COFFEE: 'los momentos con café',
  BOREDOM: 'los momentos de aburrimiento',
  WORK_BREAK: 'los descansos del trabajo',
  ANXIETY: 'los momentos de ansiedad',
  OTHER: 'ciertos momentos particulares',
};

const STRATEGY_PHRASES: Record<string, string> = {
  BREATHING: 'respirar',
  WALK: 'salir a caminar',
  DRINK_WATER: 'tomar agua',
  CALL_SOMEONE: 'llamar a alguien',
  DISTRACTION: 'distraerte con otra cosa',
  DELAY_10_MIN: 'esperar 10 minutos',
  CRAVING_SURF: 'dejar pasar la ola del impulso',
  OTHER: 'esa estrategia',
};

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string): Promise<DashboardMetrics> {
    const [momentsOvercomeCount, pulsoAnticipatedCount, user, lastSmoke] = await Promise.all([
      this.prisma.cravingEvent.count({ where: { userId, outcome: CravingOutcome.RESISTED } }),
      this.prisma.notification.count({
        where: { userId, OR: [{ openedAt: { not: null } }, { interventionStarted: true }] },
      }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.smokingEvent.findFirst({ where: { userId }, orderBy: { occurredAt: 'desc' } }),
    ]);

    const referenceDate = lastSmoke?.occurredAt ?? user.quitDate ?? user.createdAt;
    const currentStreakDays = Math.max(0, Math.floor((Date.now() - referenceDate.getTime()) / MS_PER_DAY));

    return { pulsoAnticipatedCount, momentsOvercomeCount, currentStreakDays };
  }

  async lungProgress(userId: string): Promise<LungProgressResponse> {
    const [user, lastSmoke, smokingEvents] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.smokingEvent.findFirst({ where: { userId }, orderBy: { occurredAt: 'desc' } }),
      this.prisma.smokingEvent.findMany({ where: { userId }, orderBy: { occurredAt: 'asc' }, select: { occurredAt: true } }),
    ]);

    const now = Date.now();
    const journeyStart = user.quitDate ?? user.createdAt;
    const journeyDays = Math.max(0, Math.floor((now - journeyStart.getTime()) / MS_PER_DAY));

    const streakReference = lastSmoke?.occurredAt ?? journeyStart;
    const daysSmokeFree = Math.max(0, Math.floor((now - streakReference.getTime()) / MS_PER_DAY));

    const baselineWindowStart = new Date(journeyStart.getTime() - BASELINE_WINDOW_DAYS * MS_PER_DAY);
    const baselineEvents = smokingEvents.filter(
      (e) => e.occurredAt >= baselineWindowStart && e.occurredAt < journeyStart,
    ).length;
    const baselineCigarettesPerDay =
      baselineEvents >= MIN_BASELINE_EVENTS ? baselineEvents / BASELINE_WINDOW_DAYS : DEFAULT_CIGARETTES_PER_DAY;

    const eventsSinceJourneyStart = smokingEvents.filter((e) => e.occurredAt >= journeyStart);
    const totalCigarettesSmoked = eventsSinceJourneyStart.length;
    const relapseCount = totalCigarettesSmoked;
    const cigarettesAvoided = Math.max(
      0,
      Math.round(baselineCigarettesPerDay * journeyDays) - totalCigarettesSmoked,
    );

    const currentWeek = Math.floor(daysSmokeFree / 7);
    const { progressRatio } = getLungVisualState(daysSmokeFree);

    const timelineWeeks = Math.min(MAX_TIMELINE_WEEKS, Math.floor(journeyDays / 7) + 1);
    const weeklyTimeline: LungProgressWeek[] = [];
    for (let weekNumber = 0; weekNumber < timelineWeeks; weekNumber++) {
      const startDate = new Date(journeyStart.getTime() + weekNumber * 7 * MS_PER_DAY);
      const endDate = new Date(Math.min(startDate.getTime() + 7 * MS_PER_DAY, now));
      const cigarettesSmokedInWeek = eventsSinceJourneyStart.filter(
        (e) => e.occurredAt >= startDate && e.occurredAt < endDate,
      ).length;
      weeklyTimeline.push({
        weekNumber: weekNumber + 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cigarettesSmoked: cigarettesSmokedInWeek,
        relapses: cigarettesSmokedInWeek,
        completed: cigarettesSmokedInWeek === 0,
      });
    }

    const milestones = unlockedMilestones(daysSmokeFree).map((m) => ({
      ...m,
      unlockedAt: m.unlocked ? new Date(streakReference.getTime() + m.days * MS_PER_DAY).toISOString() : null,
    }));

    return {
      daysSmokeFree,
      journeyDays,
      currentWeek,
      weekMessage: getWeekMessage(currentWeek),
      cigarettesAvoided,
      totalCigarettesSmoked,
      relapseCount,
      progressRatio,
      weeklyTimeline,
      milestones,
      medicalDisclaimer: MEDICAL_DISCLAIMER,
    };
  }

  async today(userId: string): Promise<TodayLungState> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [smokedToday, avoidedToday] = await Promise.all([
      this.prisma.smokingEvent.count({ where: { userId, occurredAt: { gte: startOfDay } } }),
      this.prisma.cravingEvent.count({
        where: { userId, outcome: CravingOutcome.RESISTED, resolvedAt: { gte: startOfDay } },
      }),
    ]);

    return { smokedToday: smokedToday > 0, avoidedToday: avoidedToday > 0 };
  }

  async insights(userId: string): Promise<InsightsResponse> {
    const profile = await this.prisma.userRiskProfile.findUnique({ where: { userId } });
    const insights: string[] = [];
    if (!profile) return { insights };

    const hourHistogram = profile.hourHistogram as Record<string, number>;
    const dayOfWeekHistogram = profile.dayOfWeekHistogram as Record<string, number>;
    const triggerFrequency = profile.triggerFrequency as Record<string, number>;
    const strategySuccessRate = profile.strategySuccessRate as Record<string, { used: number; succeeded: number }>;

    const topHour = topEntry(hourHistogram);
    if (topHour && topHour.count >= MIN_HOUR_SAMPLES_FOR_INSIGHT) {
      const hour = Number(topHour.key);
      insights.push(
        `He notado algo: el periodo alrededor de las ${String(hour).padStart(2, '0')}:00 suele ser especialmente difícil para ti.`,
      );
    }

    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const topDay = topEntry(dayOfWeekHistogram);
    if (topDay && topDay.count >= MIN_HOUR_SAMPLES_FOR_INSIGHT) {
      insights.push(`Tus ${dayNames[Number(topDay.key)]} suelen ser un poco más desafiantes que el resto de la semana.`);
    }

    const topTrigger = topEntry(triggerFrequency);
    if (topTrigger && topTrigger.count >= MIN_TRIGGER_SAMPLES_FOR_INSIGHT) {
      const phrase = TRIGGER_PHRASES[topTrigger.key as TriggerType] ?? TRIGGER_PHRASES.OTHER;
      insights.push(`He notado que ${phrase} suelen aparecer antes de tus momentos difíciles.`);
    }

    for (const [strategy, stats] of Object.entries(strategySuccessRate)) {
      if (stats.used >= MIN_STRATEGY_USES_FOR_INSIGHT && stats.succeeded / stats.used >= MIN_STRATEGY_SUCCESS_RATE_FOR_INSIGHT) {
        const phrase = STRATEGY_PHRASES[strategy] ?? STRATEGY_PHRASES.OTHER;
        insights.push(`Cuando eliges ${phrase}, sueles superar el momento. Te ha funcionado antes.`);
        break; // one strategy insight at a time is enough — this isn't a report, it's a companion noticing something.
      }
    }

    if (insights.length === 0) {
      insights.push('PULSO todavía está aprendiendo tus patrones. Con cada momento que registras, te va a conocer un poco mejor.');
    }

    return { insights };
  }
}

function topEntry(histogram: Record<string, number>): { key: string; count: number } | null {
  const entries = Object.entries(histogram).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;
  const [key, count] = entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
  return { key, count };
}
