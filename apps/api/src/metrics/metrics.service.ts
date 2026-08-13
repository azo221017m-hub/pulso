import { Injectable } from '@nestjs/common';
import { CravingOutcome, TriggerType } from '@prisma/client';
import { DashboardMetrics, InsightsResponse } from '@pulso/shared';
import { PrismaService } from '../prisma/prisma.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_HOUR_SAMPLES_FOR_INSIGHT = 4;
const MIN_TRIGGER_SAMPLES_FOR_INSIGHT = 3;
const MIN_STRATEGY_USES_FOR_INSIGHT = 3;
const MIN_STRATEGY_SUCCESS_RATE_FOR_INSIGHT = 0.6;

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
