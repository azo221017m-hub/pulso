import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EmotionalService } from './emotional.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FinalizeSessionDto } from './dto/finalize-session.dto';
import { ApplyInterventionDto } from './dto/apply-intervention.dto';

@UseGuards(JwtAuthGuard)
@Controller('emotional')
export class EmotionalController {
  constructor(private readonly emotionalService: EmotionalService) {}

  @Get('emociones')
  listEmociones() {
    return this.emotionalService.listEmociones();
  }

  @Get('intervenciones')
  listIntervenciones() {
    return this.emotionalService.listIntervenciones();
  }

  @Post('sesiones')
  startSession(@CurrentUser() user: User, @Body() dto: StartSessionDto) {
    return this.emotionalService.startSession(user.id, dto);
  }

  @Post('sesiones/:id/respuestas')
  submitAnswer(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    return this.emotionalService.submitAnswer(user.id, id, dto);
  }

  @Patch('sesiones/:id/finalizar')
  finalizeSession(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: FinalizeSessionDto) {
    return this.emotionalService.finalizeSession(user.id, id, dto);
  }

  @Post('sesiones/:id/aplicar-intervencion')
  applyIntervention(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ApplyInterventionDto) {
    return this.emotionalService.applyIntervention(user.id, id, dto);
  }

  @Get('evolucion')
  getEvolucion(@CurrentUser() user: User, @Query('rango') rango?: 'dia' | 'semana') {
    return this.emotionalService.getEvolucion(user.id, rango === 'semana' ? 'semana' : 'dia');
  }
}
