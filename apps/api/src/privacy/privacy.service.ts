import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatternLearningService } from '../pattern-learning/pattern-learning.service';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';

/** What PULSO observes, in plain language — the transparency answer to spec §19. */
const DATA_PULSO_USES = [
  'Hora habitual de consumo y de cravings',
  'Frecuencia e intervalos entre cigarrillos',
  'Día de la semana',
  'Detonantes que registras',
  'Intensidad y duración de los cravings',
  'Resultados de cada momento (resistido o fumado)',
  'Estrategias que usas y cuáles te funcionan',
  'Interacción con las notificaciones que PULSO te envía',
];

@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patternLearning: PatternLearningService,
  ) {}

  getConsent(userId: string) {
    return this.prisma.userConsent.findUniqueOrThrow({ where: { userId } });
  }

  updateConsent(userId: string, dto: UpdateConsentDto) {
    return this.prisma.userConsent.update({
      where: { userId },
      data: {
        patternLearningConsent: dto.patternLearningConsent,
        consentedAt: dto.patternLearningConsent ? new Date() : null,
      },
    });
  }

  getSettings(userId: string) {
    return this.prisma.privacySettings.findUniqueOrThrow({ where: { userId } });
  }

  updateSettings(userId: string, dto: UpdatePrivacySettingsDto) {
    return this.prisma.privacySettings.update({ where: { userId }, data: dto });
  }

  async getDataSummary(userId: string) {
    const [consent, settings, riskProfile, cravingCount, smokingCount, notificationCount] = await Promise.all([
      this.prisma.userConsent.findUnique({ where: { userId } }),
      this.prisma.privacySettings.findUnique({ where: { userId } }),
      this.prisma.userRiskProfile.findUnique({ where: { userId } }),
      this.prisma.cravingEvent.count({ where: { userId } }),
      this.prisma.smokingEvent.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      whatPulsoUses: DATA_PULSO_USES,
      consent,
      settings,
      learnedProfile: riskProfile,
      counts: { cravingEvents: cravingCount, smokingEvents: smokingCount, notifications: notificationCount },
    };
  }

  async exportData(userId: string) {
    const [user, consent, settings, cravingEvents, smokingEvents, strategyUsages, notifications, interventionSessions, riskProfile] =
      await Promise.all([
        this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
        this.prisma.userConsent.findUnique({ where: { userId } }),
        this.prisma.privacySettings.findUnique({ where: { userId } }),
        this.prisma.cravingEvent.findMany({ where: { userId } }),
        this.prisma.smokingEvent.findMany({ where: { userId } }),
        this.prisma.strategyUsage.findMany({ where: { userId } }),
        this.prisma.notification.findMany({ where: { userId } }),
        this.prisma.interventionSession.findMany({ where: { userId } }),
        this.prisma.userRiskProfile.findUnique({ where: { userId } }),
      ]);

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      exportedAt: new Date().toISOString(),
      user: safeUser,
      consent,
      settings,
      cravingEvents,
      smokingEvents,
      strategyUsages,
      notifications,
      interventionSessions,
      riskProfile,
    };
  }

  async deleteHistory(userId: string) {
    await this.prisma.$transaction([
      this.prisma.interventionSession.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.strategyUsage.deleteMany({ where: { userId } }),
      this.prisma.smokingEvent.deleteMany({ where: { userId } }),
      this.prisma.cravingEvent.deleteMany({ where: { userId } }),
    ]);
    await this.patternLearning.recomputeUserRiskProfile(userId);
    return { deleted: true };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }
}
