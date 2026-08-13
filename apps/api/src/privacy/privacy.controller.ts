import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrivacyService } from './privacy.service';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdatePrivacySettingsDto } from './dto/update-privacy-settings.dto';

@UseGuards(JwtAuthGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('consent')
  getConsent(@CurrentUser() user: User) {
    return this.privacyService.getConsent(user.id);
  }

  @Put('consent')
  updateConsent(@CurrentUser() user: User, @Body() dto: UpdateConsentDto) {
    return this.privacyService.updateConsent(user.id, dto);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return this.privacyService.getSettings(user.id);
  }

  @Put('settings')
  updateSettings(@CurrentUser() user: User, @Body() dto: UpdatePrivacySettingsDto) {
    return this.privacyService.updateSettings(user.id, dto);
  }

  @Get('data')
  getData(@CurrentUser() user: User) {
    return this.privacyService.getDataSummary(user.id);
  }

  @Get('export')
  exportData(@CurrentUser() user: User) {
    return this.privacyService.exportData(user.id);
  }

  @Delete('history')
  deleteHistory(@CurrentUser() user: User) {
    return this.privacyService.deleteHistory(user.id);
  }

  @Delete('account')
  deleteAccount(@CurrentUser() user: User) {
    return this.privacyService.deleteAccount(user.id);
  }
}
