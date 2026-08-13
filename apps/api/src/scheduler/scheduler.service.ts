import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RiskAssessment } from '@pulso/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RiskEngineService } from '../risk-engine/risk-engine.service';
import { NotificationIntelligenceService, EvaluationResult } from '../notification-intelligence/notification-intelligence.service';
import { PushService } from '../push/push.service';

export interface PipelineResult {
  risk: RiskAssessment;
  evaluation: EvaluationResult;
}

/**
 * Runs the OBSERVAR -> ESTIMAR RIESGO -> INTERVENIR pipeline for a single user: risk-engine
 * assessment, then notification-intelligence's send/suppress decision, then (if it decided to
 * send) push dispatch. Both the cron sweep and the `/risk/evaluate-now` demo endpoint call this
 * exact same function so their behavior never drifts apart.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riskEngine: RiskEngineService,
    private readonly notificationIntelligence: NotificationIntelligenceService,
    private readonly push: PushService,
  ) {}

  async runPipelineForUser(userId: string, now: Date = new Date()): Promise<PipelineResult> {
    const risk = await this.riskEngine.assessUser(userId, { now });
    const evaluation = await this.notificationIntelligence.evaluateAndSend(userId, risk, now);
    if (evaluation.notification) {
      await this.push.sendForNotification(evaluation.notification);
    }
    return { risk, evaluation };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async runForAllActiveUsers(): Promise<void> {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    this.logger.log(`Evaluando riesgo para ${users.length} usuario(s)...`);
    for (const user of users) {
      try {
        await this.runPipelineForUser(user.id);
      } catch (error) {
        this.logger.error(`Error evaluando riesgo para usuario ${user.id}`, error as Error);
      }
    }
  }
}
