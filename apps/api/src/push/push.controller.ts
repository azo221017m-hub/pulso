import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PushService } from './push.service';
import { RegisterTokenDto } from './dto/register-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('tokens')
  registerToken(@CurrentUser() user: User, @Body() dto: RegisterTokenDto) {
    return this.pushService.registerToken(user.id, dto.expoPushToken);
  }
}
