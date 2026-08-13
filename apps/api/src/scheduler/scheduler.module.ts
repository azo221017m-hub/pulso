import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';
import { NotificationIntelligenceModule } from '../notification-intelligence/notification-intelligence.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [RiskEngineModule, NotificationIntelligenceModule, PushModule],
  providers: [SchedulerService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}
