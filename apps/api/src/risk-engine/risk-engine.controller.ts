import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RiskEngineService } from './risk-engine.service';

@UseGuards(JwtAuthGuard)
@Controller('risk')
export class RiskEngineController {
  constructor(private readonly riskEngineService: RiskEngineService) {}

  @Get('me')
  assessMe(@CurrentUser() user: User) {
    return this.riskEngineService.assessUser(user.id);
  }
}
