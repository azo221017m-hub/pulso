import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InterventionService } from './intervention.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { CompleteInterventionDto } from './dto/complete-intervention.dto';

@UseGuards(JwtAuthGuard)
@Controller('interventions')
export class InterventionController {
  constructor(private readonly interventionService: InterventionService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateInterventionDto) {
    return this.interventionService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: User) {
    return this.interventionService.list(user.id);
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CompleteInterventionDto) {
    return this.interventionService.complete(user.id, id, dto);
  }
}
