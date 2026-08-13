-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('STRESS', 'AFTER_MEAL', 'SOCIAL', 'ALCOHOL', 'COFFEE', 'BOREDOM', 'WORK_BREAK', 'ANXIETY', 'OTHER');

-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('BREATHING', 'WALK', 'DRINK_WATER', 'CALL_SOMEONE', 'DISTRACTION', 'DELAY_10_MIN', 'CRAVING_SURF', 'OTHER');

-- CreateEnum
CREATE TYPE "CravingOutcome" AS ENUM ('PENDING', 'RESISTED', 'SMOKED');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('encouragement', 'empathy', 'reflection', 'anticipation', 'achievement', 'resilience', 'identity', 'self_control', 'hope', 'companionship', 'reminder', 'craving_intervention', 'relapse_recovery');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('WARM', 'CALM', 'DIRECT', 'PLAYFUL', 'SERIOUS');

-- CreateEnum
CREATE TYPE "NotificationOutcome" AS ENUM ('UNKNOWN', 'CRAVING_LOGGED', 'SMOKED_ANYWAY', 'DID_NOT_SMOKE', 'IGNORED');

-- CreateEnum
CREATE TYPE "InterventionSessionStatus" AS ENUM ('STARTED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MoodCheck" AS ENUM ('BETTER', 'SAME', 'NEED_HELP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "quitMotivation" TEXT,
    "quitDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternLearningConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" INTEGER NOT NULL DEFAULT 22,
    "quietHoursEnd" INTEGER NOT NULL DEFAULT 8,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CravingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intensity" INTEGER NOT NULL,
    "triggers" "TriggerType"[],
    "notes" TEXT,
    "durationSeconds" INTEGER,
    "outcome" "CravingOutcome" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "sourceNotificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CravingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmokingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cravingEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmokingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cravingEventId" TEXT,
    "strategy" "StrategyType" NOT NULL,
    "succeeded" BOOLEAN,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRiskProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hourHistogram" JSONB NOT NULL DEFAULT '{}',
    "dayOfWeekHistogram" JSONB NOT NULL DEFAULT '{}',
    "triggerFrequency" JSONB NOT NULL DEFAULT '{}',
    "strategySuccessRate" JSONB NOT NULL DEFAULT '{}',
    "avgIntervalMinutes" DOUBLE PRECISION,
    "lastSmokedAt" TIMESTAMP(3),
    "lastCravingAt" TIMESTAMP(3),
    "recentCravingCount7d" INTEGER NOT NULL DEFAULT 0,
    "recentRelapseCount7d" INTEGER NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "category" "MessageCategory" NOT NULL,
    "tone" "Tone" NOT NULL DEFAULT 'WARM',
    "minAlertLevel" INTEGER NOT NULL DEFAULT 0,
    "maxAlertLevel" INTEGER NOT NULL DEFAULT 4,
    "text" TEXT NOT NULL,
    "supportsMotivationPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "supportsStatPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertLevel" INTEGER NOT NULL,
    "messageTemplateId" TEXT NOT NULL,
    "renderedText" TEXT NOT NULL,
    "category" "MessageCategory" NOT NULL,
    "tone" "Tone" NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskBreakdown" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "interventionStarted" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "NotificationOutcome" NOT NULL DEFAULT 'UNKNOWN',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT,
    "cravingEventId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER NOT NULL DEFAULT 300,
    "completedAt" TIMESTAMP(3),
    "status" "InterventionSessionStatus" NOT NULL DEFAULT 'STARTED',
    "moodCheck" "MoodCheck",

    CONSTRAINT "InterventionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_userId_key" ON "UserConsent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacySettings_userId_key" ON "PrivacySettings"("userId");

-- CreateIndex
CREATE INDEX "CravingEvent_userId_occurredAt_idx" ON "CravingEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "SmokingEvent_userId_occurredAt_idx" ON "SmokingEvent"("userId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRiskProfile_userId_key" ON "UserRiskProfile"("userId");

-- CreateIndex
CREATE INDEX "MessageTemplate_category_minAlertLevel_maxAlertLevel_active_idx" ON "MessageTemplate"("category", "minAlertLevel", "maxAlertLevel", "active");

-- CreateIndex
CREATE INDEX "Notification_userId_sentAt_idx" ON "Notification"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "InterventionSession_userId_startedAt_idx" ON "InterventionSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_expoPushToken_key" ON "PushToken"("expoPushToken");

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacySettings" ADD CONSTRAINT "PrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CravingEvent" ADD CONSTRAINT "CravingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CravingEvent" ADD CONSTRAINT "CravingEvent_sourceNotificationId_fkey" FOREIGN KEY ("sourceNotificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmokingEvent" ADD CONSTRAINT "SmokingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmokingEvent" ADD CONSTRAINT "SmokingEvent_cravingEventId_fkey" FOREIGN KEY ("cravingEventId") REFERENCES "CravingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyUsage" ADD CONSTRAINT "StrategyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyUsage" ADD CONSTRAINT "StrategyUsage_cravingEventId_fkey" FOREIGN KEY ("cravingEventId") REFERENCES "CravingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRiskProfile" ADD CONSTRAINT "UserRiskProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "MessageTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionSession" ADD CONSTRAINT "InterventionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionSession" ADD CONSTRAINT "InterventionSession_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionSession" ADD CONSTRAINT "InterventionSession_cravingEventId_fkey" FOREIGN KEY ("cravingEventId") REFERENCES "CravingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
