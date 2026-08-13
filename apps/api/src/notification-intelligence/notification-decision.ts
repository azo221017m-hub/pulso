import { AlertLevel, getLocalHour, isWithinQuietHours, minutesBetween, RiskBand } from '@pulso/shared';
import {
  DAILY_NOTIFICATION_CAP,
  MIN_ALERT_RISK_SCORE,
  MIN_NEW_INFORMATION_DELTA,
  NOTIFICATION_COOLDOWN_MINUTES,
  RECENT_CRAVING_SUPPRESS_MINUTES,
  RECENT_SMOKING_SUPPRESS_MINUTES,
} from '../config/notification.config';

export interface RecentNotificationSummary {
  sentAt: Date;
  openedAt: Date | null;
  riskScore: number;
  band: RiskBand;
  alertLevel: number;
}

export interface NotificationDecisionContext {
  now: Date;
  timezone: string;
  riskScore: number;
  band: RiskBand;
  predictionsEnabled: boolean;
  notificationsEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  lastCravingLoggedAt: Date | null;
  lastSmokedAt: Date | null;
  /** Most recent first. Only notifications from the last 24h are needed for the daily cap. */
  recentNotifications: RecentNotificationSummary[];
}

export type SuppressReason =
  | 'disabled'
  | 'quiet_hours'
  | 'below_threshold'
  | 'recent_craving_logged'
  | 'recent_smoking_logged'
  | 'cooldown'
  | 'daily_cap'
  | 'no_new_information';

export interface NotificationDecision {
  send: boolean;
  alertLevel: AlertLevel;
  reason: SuppressReason | 'ok';
}

const ESCALATION_WINDOW_HOURS = 6;

function candidateAlertLevel(band: RiskBand, last: RecentNotificationSummary | undefined, now: Date): AlertLevel {
  if (band === RiskBand.VERY_HIGH) return 4;
  if (band === RiskBand.HIGH) {
    const recentlyEscalating =
      last &&
      last.alertLevel >= 2 &&
      (last.band === RiskBand.HIGH || last.band === RiskBand.VERY_HIGH) &&
      minutesBetween(now, last.sentAt) / 60 <= ESCALATION_WINDOW_HOURS;
    return recentlyEscalating ? 3 : 2;
  }
  if (band === RiskBand.MODERATE) return 1;
  return 0;
}

/**
 * "Notification Intelligence" (spec §5) — decides whether a proactive alert should be sent
 * right now, and at which of the 4 intervention levels. Pure function, no DB access, so every
 * suppression rule can be unit tested in isolation.
 */
export function decideNotification(ctx: NotificationDecisionContext): NotificationDecision {
  if (!ctx.predictionsEnabled || !ctx.notificationsEnabled) {
    return { send: false, alertLevel: 0, reason: 'disabled' };
  }

  const localHour = getLocalHour(ctx.now, ctx.timezone);
  if (isWithinQuietHours(localHour, ctx.quietHoursStart, ctx.quietHoursEnd)) {
    return { send: false, alertLevel: 0, reason: 'quiet_hours' };
  }

  if (ctx.riskScore < MIN_ALERT_RISK_SCORE) {
    return { send: false, alertLevel: 0, reason: 'below_threshold' };
  }

  if (ctx.lastCravingLoggedAt && minutesBetween(ctx.now, ctx.lastCravingLoggedAt) < RECENT_CRAVING_SUPPRESS_MINUTES) {
    return { send: false, alertLevel: 0, reason: 'recent_craving_logged' };
  }

  if (ctx.lastSmokedAt && minutesBetween(ctx.now, ctx.lastSmokedAt) < RECENT_SMOKING_SUPPRESS_MINUTES) {
    return { send: false, alertLevel: 0, reason: 'recent_smoking_logged' };
  }

  const last = ctx.recentNotifications[0];
  const alertLevel = candidateAlertLevel(ctx.band, last, ctx.now);

  if (last) {
    const cooldownMinutes =
      alertLevel === 4
        ? NOTIFICATION_COOLDOWN_MINUTES.level4
        : last.openedAt
          ? NOTIFICATION_COOLDOWN_MINUTES.base
          : NOTIFICATION_COOLDOWN_MINUTES.ifIgnored;
    if (minutesBetween(ctx.now, last.sentAt) < cooldownMinutes) {
      return { send: false, alertLevel: 0, reason: 'cooldown' };
    }
  }

  const last24h = ctx.recentNotifications.filter((n) => minutesBetween(ctx.now, n.sentAt) <= 24 * 60);
  if (last24h.length >= DAILY_NOTIFICATION_CAP) {
    return { send: false, alertLevel: 0, reason: 'daily_cap' };
  }

  if (last) {
    const sameBand = last.band === ctx.band;
    const delta = ctx.riskScore - last.riskScore;
    if (sameBand && delta < MIN_NEW_INFORMATION_DELTA) {
      return { send: false, alertLevel: 0, reason: 'no_new_information' };
    }
  }

  return { send: true, alertLevel, reason: 'ok' };
}
