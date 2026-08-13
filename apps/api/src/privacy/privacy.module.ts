import { Module } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { PatternLearningModule } from '../pattern-learning/pattern-learning.module';

@Module({
  imports: [PatternLearningModule],
  providers: [PrivacyService],
  controllers: [PrivacyController],
})
export class PrivacyModule {}
