import { Module } from '@nestjs/common';
import { NotificationIntelligenceService } from './notification-intelligence.service';
import { NotificationIntelligenceController } from './notification-intelligence.controller';
import { MessageBankModule } from '../message-bank/message-bank.module';

@Module({
  imports: [MessageBankModule],
  providers: [NotificationIntelligenceService],
  controllers: [NotificationIntelligenceController],
  exports: [NotificationIntelligenceService],
})
export class NotificationIntelligenceModule {}
