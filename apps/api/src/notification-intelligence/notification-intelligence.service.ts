import { Injectable } from '@nestjs/common';
import { CravingOutcome, Notification } from '@prisma/client';
import { bandForScore, RiskAssessment } from '@pulso/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MessageSelectionService } from '../message-bank/message-selection.service';
import { decideNotification, NotificationDecision } from './notification-decision';

export interface EvaluationResult {
  decision: NotificationDecision;
  notification: Notification | null;
}

const RECENT_NOTIFICATION_LOOKBACK = 10;

@Injectable()
export class NotificationIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageSelection: MessageSelectionService,
  ) {}

  async evaluateAndSend(userId: string, risk: RiskAssessment, now: Date = new Date()): Promise<EvaluationResult> {
    const [user, privacySettings, recentNotifications, lastCraving, lastSmoke, momentsOvercomeToday] =
      await Promise.all([
        this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
        this.prisma.privacySettings.findUniqueOrThrow({ where: { userId } }),
        this.prisma.notification.findMany({
          where: { userId },
          orderBy: { sentAt: 'desc' },
          take: RECENT_NOTIFICATION_LOOKBACK,
        }),
        this.prisma.cravingEvent.findFirst({ where: { userId }, orderBy: { occurredAt: 'desc' } }),
        this.prisma.smokingEvent.findFirst({ where: { userId }, orderBy: { occurredAt: 'desc' } }),
        this.prisma.cravingEvent.count({
          where: {
            userId,
            outcome: CravingOutcome.RESISTED,
            occurredAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          },
        }),
      ]);

    const decision = decideNotification({
      now,
      timezone: user.timezone,
      riskScore: risk.riskScore,
      band: risk.band,
      predictionsEnabled: privacySettings.predictionsEnabled,
      notificationsEnabled: privacySettings.notificationsEnabled,
      quietHoursStart: privacySettings.quietHoursStart,
      quietHoursEnd: privacySettings.quietHoursEnd,
      lastCravingLoggedAt: lastCraving?.occurredAt ?? null,
      lastSmokedAt: lastSmoke?.occurredAt ?? null,
      recentNotifications: recentNotifications.map((n) => ({
        sentAt: n.sentAt,
        openedAt: n.openedAt,
        riskScore: n.riskScore,
        // band isn't persisted separately — derive it from the stored score with the same
        // classifier used everywhere else, so historical rows stay consistent if bands are retuned.
        band: bandForScore(n.riskScore),
        alertLevel: n.alertLevel,
      })),
    });

    if (!decision.send) {
      return { decision, notification: null };
    }

    const { template, renderedText } = await this.messageSelection.selectMessage(
      userId,
      decision.alertLevel as 1 | 2 | 3 | 4,
      user.quitMotivation,
      momentsOvercomeToday > 0 ? momentsOvercomeToday : undefined,
    );

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        alertLevel: decision.alertLevel,
        messageTemplateId: template.id,
        renderedText,
        category: template.category,
        tone: template.tone,
        riskScore: risk.riskScore,
        riskBreakdown: risk.breakdown as unknown as object,
        sentAt: now,
      },
    });

    return { decision, notification };
  }

  markOpened(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { openedAt: new Date() },
    });
  }
}
