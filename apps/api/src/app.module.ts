import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { PatternLearningModule } from './pattern-learning/pattern-learning.module';
import { RiskEngineModule } from './risk-engine/risk-engine.module';
import { MessageBankModule } from './message-bank/message-bank.module';
import { NotificationIntelligenceModule } from './notification-intelligence/notification-intelligence.module';
import { PushModule } from './push/push.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { InterventionModule } from './intervention/intervention.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrivacyModule } from './privacy/privacy.module';
import { EmotionalModule } from './emotional/emotional.module';
import { Tsq8Module } from './tsq8/tsq8.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatternLearningModule,
    EventsModule,
    RiskEngineModule,
    MessageBankModule,
    NotificationIntelligenceModule,
    PushModule,
    SchedulerModule,
    InterventionModule,
    MetricsModule,
    PrivacyModule,
    EmotionalModule,
    Tsq8Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
