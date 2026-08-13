import { Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SchedulerService } from './scheduler.service';

@UseGuards(JwtAuthGuard)
@Controller('risk')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  /**
   * Runs the exact same risk -> notification -> push pipeline the cron uses, synchronously,
   * for the calling user only. This is the primary way to test/demo the golden path without
   * waiting on real cron timing (spec §23).
   */
  @Post('evaluate-now')
  evaluateNow(@CurrentUser() user: User) {
    return this.schedulerService.runPipelineForUser(user.id);
  }
}
