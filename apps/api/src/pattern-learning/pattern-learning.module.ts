import { Module } from '@nestjs/common';
import { PatternLearningService } from './pattern-learning.service';

@Module({
  providers: [PatternLearningService],
  exports: [PatternLearningService],
})
export class PatternLearningModule {}
