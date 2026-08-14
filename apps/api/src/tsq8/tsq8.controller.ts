import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Tsq8Service } from './tsq8.service';
import { ActivateTsq8Dto } from './dto/activate-tsq8.dto';

@UseGuards(JwtAuthGuard)
@Controller('tsq8')
export class Tsq8Controller {
  constructor(private readonly tsq8Service: Tsq8Service) {}

  @Post('activar')
  activate(@CurrentUser() user: User, @Body() dto: ActivateTsq8Dto) {
    return this.tsq8Service.activate(user.id, dto);
  }
}
