/**
 * Notification Intelligence constants (spec §5). Centralized so "don't spam" behavior can be
 * tuned in one place instead of scattered magic numbers.
 */
export const NOTIFICATION_COOLDOWN_MINUTES = {
  base: 90,
  /** Extended cooldown when the previous notification was never opened — don't nag an ignored alert. */
  ifIgnored: 135,
  /** Shorter cooldown for level 4 — true 80+ spikes are rare and important enough to bypass the standard throttle. */
  level4: 30,
};

export const DAILY_NOTIFICATION_CAP = 4;

export const QUIET_HOURS_DEFAULT = { start: 22, end: 8 };

export const RECENT_CRAVING_SUPPRESS_MINUTES = 15;
export const RECENT_SMOKING_SUPPRESS_MINUTES = 20;

/** Below this riskScore, no proactive notification is ever sent (alert level 0). */
export const MIN_ALERT_RISK_SCORE = 30;

/** Minimum riskScore delta vs. the last notification to count as "new information" within the same band. */
export const MIN_NEW_INFORMATION_DELTA = 10;

export const ALERT_LEVEL_CATEGORIES = {
  1: ['compania', 'animo', 'empatia', 'reflexion', 'recordatorio'],
  2: ['anticipacion', 'autocontrol', 'resiliencia', 'compania'],
  3: ['intervencion_impulso', 'autocontrol', 'resiliencia', 'compania'],
  4: ['intervencion_impulso'],
} as const;
