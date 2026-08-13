import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InterventionSessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { CompleteInterventionDto } from './dto/complete-intervention.dto';

@Injectable()
export class InterventionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInterventionDto) {
    const session = await this.prisma.interventionSession.create({
      data: {
        userId,
        notificationId: dto.notificationId,
        cravingEventId: dto.cravingEventId,
        durationSeconds: dto.durationSeconds ?? 300,
      },
    });

    if (dto.notificationId) {
      await this.prisma.notification.updateMany({
        where: { id: dto.notificationId, userId },
        data: { interventionStarted: true },
      });
    }

    return session;
  }

  async complete(userId: string, id: string, dto: CompleteInterventionDto) {
    const session = await this.prisma.interventionSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sesión no encontrada.');
    if (session.userId !== userId) throw new ForbiddenException();

    return this.prisma.interventionSession.update({
      where: { id },
      data: {
        completedAt: new Date(),
        status: dto.status ?? InterventionSessionStatus.COMPLETED,
        moodCheck: dto.moodCheck,
      },
    });
  }

  list(userId: string) {
    return this.prisma.interventionSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }
}
