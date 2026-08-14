import { Module } from '@nestjs/common';
import { EmotionalService } from './emotional.service';
import { EmotionalController } from './emotional.controller';

@Module({
  providers: [EmotionalService],
  controllers: [EmotionalController],
})
export class EmotionalModule {}
