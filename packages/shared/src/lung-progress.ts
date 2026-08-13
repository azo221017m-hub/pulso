/**
 * "Evolución de mis pulmones" — pure functions shared by API and mobile. No percentages of
 * lung function are ever computed here; only day counts and a 0-1 progress ratio driving the
 * animation. See MEDICAL_DISCLAIMER.
 */

export const DEFAULT_CIGARETTES_PER_DAY = 10;

/** Days at which the visual progress curve is considered essentially maxed out. */
const PLATEAU_DAYS = 180;

export const MEDICAL_DISCLAIMER =
  'Esta visualización representa tu progreso en el proceso de dejar de fumar y no constituye una medición médica de la función pulmonar.';

export interface Milestone {
  days: number;
  emoji: string;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { days: 1, emoji: '🫁', label: 'Primer día' },
  { days: 3, emoji: '🔥', label: '3 días' },
  { days: 7, emoji: '🏆', label: '7 días' },
  { days: 14, emoji: '💪', label: '14 días' },
  { days: 21, emoji: '🚀', label: '21 días' },
  { days: 30, emoji: '🫁', label: '30 días' },
  { days: 60, emoji: '🏅', label: '60 días' },
  { days: 90, emoji: '🏆', label: '90 días' },
  { days: 180, emoji: '👑', label: '180 días' },
  { days: 365, emoji: '🌟', label: '365 días' },
];

const WEEK_MESSAGES: Record<number, string> = {
  0: 'Hoy comienza tu recuperación.',
  1: '7 días. Ya estás construyendo un nuevo hábito.',
  2: '14 días. Tu constancia está haciendo la diferencia.',
  3: '21 días. Has superado una etapa importante.',
  4: '28 días. Tu nuevo hábito está tomando fuerza.',
};

/** `weekNumber = floor(daysSmokeFree / 7)`. Falls back to a generic message beyond the spec's explicit list. */
export function getWeekMessage(weekNumber: number): string {
  if (weekNumber in WEEK_MESSAGES) return WEEK_MESSAGES[weekNumber];
  const days = weekNumber * 7;
  return `${days} días. Sigues avanzando — un poco más adelante que ayer.`;
}

export interface LungVisualState {
  /** 0 (start) - 1 (plateau). Diminishing-returns curve so changes are subtle after ~6 months. */
  progressRatio: number;
  /** 0 (clear) - 1 (heavy smoke). */
  smokeOpacity: number;
  particleCount: number;
  /** Relative breathing animation speed multiplier: 1 = calm/steady, higher = faster/shallower. */
  breathingSpeed: number;
}

export function getLungVisualState(daysSmokeFree: number): LungVisualState {
  const days = Math.max(0, daysSmokeFree);
  const progressRatio = 1 - Math.exp(-days / PLATEAU_DAYS);
  return {
    progressRatio,
    smokeOpacity: Math.max(0, 1 - progressRatio * 1.15),
    particleCount: Math.round(Math.max(0, 10 - progressRatio * 10)),
    breathingSpeed: 1 + (1 - progressRatio) * 0.8,
  };
}

export function unlockedMilestones(daysSmokeFree: number): (Milestone & { unlocked: boolean })[] {
  return MILESTONES.map((m) => ({ ...m, unlocked: daysSmokeFree >= m.days }));
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface TimelineWeekLike {
  relapses: number;
  startDate: string;
  endDate: string;
}

/**
 * Client-side estimate of "days smoke-free at the end of week N", from the always-growing
 * weeklyTimeline (which never resets on relapse). Any week with a relapse is assumed to reset
 * the streak by its end — a simplification since exact relapse time-of-week isn't tracked.
 */
export function estimateStreakDaysAtWeekEnd(weeks: TimelineWeekLike[], upToIndex: number): number {
  let streak = 0;
  for (let i = 0; i <= upToIndex && i < weeks.length; i++) {
    const week = weeks[i];
    const weekLengthDays = Math.round((new Date(week.endDate).getTime() - new Date(week.startDate).getTime()) / MS_PER_DAY);
    streak = week.relapses > 0 ? 0 : streak + weekLengthDays;
  }
  return streak;
}
