import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationIntelligenceService } from './notification-intelligence.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationIntelligenceController {
  constructor(
    private readonly notificationIntelligence: NotificationIntelligenceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  @Post(':id/open')
  markOpened(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationIntelligence.markOpened(id, user.id);
  }
}
