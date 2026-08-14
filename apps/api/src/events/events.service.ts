import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CravingOutcome, NotificationOutcome } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PatternLearningService } from '../pattern-learning/pattern-learning.service';
import { CreateCravingDto } from './dto/create-craving.dto';
import { ResolveCravingDto } from './dto/resolve-craving.dto';
import { CreateSmokingDto } from './dto/create-smoking.dto';
import { CreateStrategyUsageDto } from './dto/create-strategy-usage.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patternLearning: PatternLearningService,
  ) {}

  async createCraving(userId: string, dto: CreateCravingDto) {
    const craving = await this.prisma.cravingEvent.create({
      data: {
        userId,
        intensity: dto.intensity,
        triggers: dto.triggers ?? [],
        notes: dto.notes,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        sourceNotificationId: dto.sourceNotificationId,
      },
    });

    if (dto.sourceNotificationId) {
      await this.prisma.notification.updateMany({
        where: { id: dto.sourceNotificationId, userId },
        data: { outcome: NotificationOutcome.CRAVING_LOGGED },
      });
    }

    await this.patternLearning.recomputeUserRiskProfile(userId);
    return craving;
  }

  listCravings(userId: string) {
    return this.prisma.cravingEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  async resolveCraving(userId: string, id: string, dto: ResolveCravingDto) {
    const craving = await this.prisma.cravingEvent.findUnique({ where: { id } });
    if (!craving) throw new NotFoundException('Craving no encontrado.');
    if (craving.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.cravingEvent.update({
      where: { id },
      data: {
        outcome: dto.outcome,
        durationSeconds: dto.durationSeconds,
        resolvedAt: new Date(),
      },
    });

    if (dto.outcome === CravingOutcome.SMOKED) {
      const existingSmoke = await this.prisma.smokingEvent.findFirst({ where: { cravingEventId: id } });
      if (!existingSmoke) {
        await this.prisma.smokingEvent.create({ data: { userId, cravingEventId: id } });
      }
    }

    if (dto.strategy) {
      await this.prisma.strategyUsage.create({
        data: {
          userId,
          cravingEventId: id,
          strategy: dto.strategy,
          succeeded: dto.strategySucceeded ?? dto.outcome === CravingOutcome.RESISTED,
        },
      });
    }

    if (craving.sourceNotificationId) {
      const outcome =
        dto.outcome === CravingOutcome.SMOKED
          ? NotificationOutcome.SMOKED_ANYWAY
          : NotificationOutcome.DID_NOT_SMOKE;
      await this.prisma.notification.updateMany({
        where: { id: craving.sourceNotificationId },
        data: { outcome },
      });
    }

    await this.patternLearning.recomputeUserRiskProfile(userId);
    return updated;
  }

  /** Quick log for "evité un cigarrillo" from Home — no craving was felt, so it skips intensity/triggers. */
  async logAvoided(userId: string) {
    const now = new Date();
    const craving = await this.prisma.cravingEvent.create({
      data: {
        userId,
        intensity: 1,
        triggers: [],
        occurredAt: now,
        outcome: CravingOutcome.RESISTED,
        resolvedAt: now,
      },
    });
    await this.patternLearning.recomputeUserRiskProfile(userId);
    return craving;
  }

  async createSmoking(userId: string, dto: CreateSmokingDto) {
    const smoking = await this.prisma.smokingEvent.create({
      data: {
        userId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        cravingEventId: dto.cravingEventId,
      },
    });
    await this.patternLearning.recomputeUserRiskProfile(userId);
    return smoking;
  }

  listSmoking(userId: string) {
    return this.prisma.smokingEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  async createStrategyUsage(userId: string, dto: CreateStrategyUsageDto) {
    const usage = await this.prisma.strategyUsage.create({
      data: {
        userId,
        strategy: dto.strategy,
        cravingEventId: dto.cravingEventId,
        succeeded: dto.succeeded,
      },
    });
    await this.patternLearning.recomputeUserRiskProfile(userId);
    return usage;
  }
}
