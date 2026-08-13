import { Module } from '@nestjs/common';
import { InterventionService } from './intervention.service';
import { InterventionController } from './intervention.controller';

@Module({
  providers: [InterventionService],
  controllers: [InterventionController],
})
export class InterventionModule {}
