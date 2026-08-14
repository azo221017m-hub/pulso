import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MetricsService } from './metrics.service';

@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: User) {
    return this.metricsService.dashboard(user.id);
  }

  @Get('insights')
  insights(@CurrentUser() user: User) {
    return this.metricsService.insights(user.id);
  }

  @Get('lung-progress')
  lungProgress(@CurrentUser() user: User) {
    return this.metricsService.lungProgress(user.id);
  }

  @Get('today')
  today(@CurrentUser() user: User) {
    return this.metricsService.today(user.id);
  }
}
