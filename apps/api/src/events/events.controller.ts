import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventsService } from './events.service';
import { CreateCravingDto } from './dto/create-craving.dto';
import { ResolveCravingDto } from './dto/resolve-craving.dto';
import { CreateSmokingDto } from './dto/create-smoking.dto';
import { CreateStrategyUsageDto } from './dto/create-strategy-usage.dto';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('cravings')
  createCraving(@CurrentUser() user: User, @Body() dto: CreateCravingDto) {
    return this.eventsService.createCraving(user.id, dto);
  }

  @Get('cravings')
  listCravings(@CurrentUser() user: User) {
    return this.eventsService.listCravings(user.id);
  }

  @Patch('cravings/:id')
  resolveCraving(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ResolveCravingDto) {
    return this.eventsService.resolveCraving(user.id, id, dto);
  }

  @Post('smoking')
  createSmoking(@CurrentUser() user: User, @Body() dto: CreateSmokingDto) {
    return this.eventsService.createSmoking(user.id, dto);
  }

  @Get('smoking')
  listSmoking(@CurrentUser() user: User) {
    return this.eventsService.listSmoking(user.id);
  }

  @Post('strategies')
  createStrategyUsage(@CurrentUser() user: User, @Body() dto: CreateStrategyUsageDto) {
    return this.eventsService.createStrategyUsage(user.id, dto);
  }
}
