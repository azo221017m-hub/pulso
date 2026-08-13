import { RiskBand } from '@pulso/shared';
import { decideNotification, NotificationDecisionContext, RecentNotificationSummary } from './notification-decision';

const NOW = new Date('2026-08-12T18:40:00Z');

function baseContext(overrides: Partial<NotificationDecisionContext> = {}): NotificationDecisionContext {
  return {
    now: NOW,
    timezone: 'UTC',
    riskScore: 78,
    band: RiskBand.VERY_HIGH,
    predictionsEnabled: true,
    notificationsEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    lastCravingLoggedAt: null,
    lastSmokedAt: null,
    recentNotifications: [],
    ...overrides,
  };
}

function notif(overrides: Partial<RecentNotificationSummary>): RecentNotificationSummary {
  return {
    sentAt: NOW,
    openedAt: null,
    riskScore: 78,
    band: RiskBand.VERY_HIGH,
    alertLevel: 4,
    ...overrides,
  };
}

describe('decideNotification', () => {
  it('sends a level 4 alert for the golden-path VERY_HIGH scenario with no prior history', () => {
    const decision = decideNotification(baseContext());
    expect(decision).toEqual({ send: true, alertLevel: 4, reason: 'ok' });
  });

  it('suppresses when predictions are disabled', () => {
    const decision = decideNotification(baseContext({ predictionsEnabled: false }));
    expect(decision.send).toBe(false);
    expect(decision.reason).toBe('disabled');
  });

  it('suppresses when notifications are disabled', () => {
    const decision = decideNotification(baseContext({ notificationsEnabled: false }));
    expect(decision.reason).toBe('disabled');
  });

  it('suppresses during quiet hours, wrapping past midnight', () => {
    const decision = decideNotification(
      baseContext({ now: new Date('2026-08-12T23:00:00Z'), quietHoursStart: 22, quietHoursEnd: 8 }),
    );
    expect(decision.reason).toBe('quiet_hours');
  });

  it('does not suppress just outside the quiet-hours window', () => {
    const decision = decideNotification(
      baseContext({ now: new Date('2026-08-12T08:30:00Z'), quietHoursStart: 22, quietHoursEnd: 8 }),
    );
    expect(decision.send).toBe(true);
  });

  it('sends nothing (level 0) below the minimum risk threshold', () => {
    const decision = decideNotification(baseContext({ riskScore: 20, band: RiskBand.LOW }));
    expect(decision).toEqual({ send: false, alertLevel: 0, reason: 'below_threshold' });
  });

  it('suppresses if a craving was logged in the last 15 minutes', () => {
    const decision = decideNotification(
      baseContext({ lastCravingLoggedAt: new Date(NOW.getTime() - 5 * 60_000) }),
    );
    expect(decision.reason).toBe('recent_craving_logged');
  });

  it('does not suppress once the craving-logged window has passed', () => {
    const decision = decideNotification(
      baseContext({ lastCravingLoggedAt: new Date(NOW.getTime() - 20 * 60_000) }),
    );
    expect(decision.send).toBe(true);
  });

  it('suppresses if the user just smoked in the last 20 minutes', () => {
    const decision = decideNotification(baseContext({ lastSmokedAt: new Date(NOW.getTime() - 10 * 60_000) }));
    expect(decision.reason).toBe('recent_smoking_logged');
  });

  it('applies the base 90-minute cooldown when the previous notification was opened', () => {
    const last = notif({ sentAt: new Date(NOW.getTime() - 60 * 60_000), openedAt: new Date(), riskScore: 40, band: RiskBand.MODERATE });
    const decision = decideNotification(baseContext({ riskScore: 45, band: RiskBand.MODERATE, recentNotifications: [last] }));
    expect(decision.reason).toBe('cooldown');
  });

  it('passes the base cooldown once 90 minutes have elapsed', () => {
    const last = notif({ sentAt: new Date(NOW.getTime() - 91 * 60_000), openedAt: new Date(), riskScore: 40, band: RiskBand.MODERATE });
    const decision = decideNotification(baseContext({ riskScore: 55, band: RiskBand.MODERATE, recentNotifications: [last] }));
    expect(decision.send).toBe(true);
  });

  it('extends the cooldown to 135 minutes when the previous notification was never opened', () => {
    const last = notif({ sentAt: new Date(NOW.getTime() - 100 * 60_000), openedAt: null, riskScore: 40, band: RiskBand.MODERATE });
    const decision = decideNotification(baseContext({ riskScore: 45, band: RiskBand.MODERATE, recentNotifications: [last] }));
    expect(decision.reason).toBe('cooldown');
  });

  it('uses a short 30-minute cooldown for level 4, bypassing the standard throttle', () => {
    const last = notif({ sentAt: new Date(NOW.getTime() - 35 * 60_000), openedAt: null, riskScore: 60 });
    const decision = decideNotification(baseContext({ recentNotifications: [last] }));
    expect(decision.send).toBe(true);
    expect(decision.alertLevel).toBe(4);
  });

  it('enforces the daily cap of 4 notifications per rolling 24h', () => {
    const recentNotifications = Array.from({ length: 4 }, (_, i) =>
      notif({ sentAt: new Date(NOW.getTime() - (i + 1) * 30 * 60_000), openedAt: new Date(), riskScore: 40, band: RiskBand.MODERATE }),
    );
    const decision = decideNotification(baseContext({ recentNotifications }));
    expect(decision.reason).toBe('daily_cap');
  });

  it('suppresses when the new score offers no new information within the same band', () => {
    const last = notif({
      sentAt: new Date(NOW.getTime() - 200 * 60_000),
      openedAt: new Date(),
      riskScore: 75,
      band: RiskBand.VERY_HIGH,
    });
    const decision = decideNotification(baseContext({ riskScore: 78, band: RiskBand.VERY_HIGH, recentNotifications: [last] }));
    expect(decision.reason).toBe('no_new_information');
  });

  it('allows a send when risk crosses into a higher band even if the delta is small', () => {
    const last = notif({
      sentAt: new Date(NOW.getTime() - 200 * 60_000),
      openedAt: new Date(),
      riskScore: 59,
      band: RiskBand.MODERATE,
      alertLevel: 1,
    });
    const decision = decideNotification(baseContext({ riskScore: 61, band: RiskBand.HIGH, recentNotifications: [last] }));
    expect(decision.send).toBe(true);
    expect(decision.alertLevel).toBe(2);
  });

  it('escalates HIGH to alert level 3 when a level-2+ notification already fired recently in the same episode', () => {
    const last = notif({
      sentAt: new Date(NOW.getTime() - 150 * 60_000),
      openedAt: new Date(),
      riskScore: 65,
      band: RiskBand.HIGH,
      alertLevel: 2,
    });
    const decision = decideNotification(baseContext({ riskScore: 76, band: RiskBand.HIGH, recentNotifications: [last] }));
    expect(decision.send).toBe(true);
    expect(decision.alertLevel).toBe(3);
  });
});
