import { IsBoolean } from 'class-validator';

export class UpdateConsentDto {
  @IsBoolean()
  patternLearningConsent: boolean;
}
