import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PatternLearningModule } from '../pattern-learning/pattern-learning.module';

@Module({
  imports: [PatternLearningModule],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
