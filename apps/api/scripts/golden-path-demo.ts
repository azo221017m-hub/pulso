/**
 * One-off verification script for the spec §23 golden path: seeds a demo user with historical
 * events skewed toward the CURRENT hour/weekday (so the demo works regardless of when it's
 * run), recomputes their real pattern profile from those events (not hand-crafted), then runs
 * the actual risk-engine + notification-intelligence + scheduler pipeline and prints the result.
 *
 * Run with: npx ts-node -r tsconfig-paths/register scripts/golden-path-demo.ts
 */
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { CravingOutcome, TriggerType } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PatternLearningService } from '../src/pattern-learning/pattern-learning.service';
import { RiskEngineService } from '../src/risk-engine/risk-engine.service';
import { SchedulerService } from '../src/scheduler/scheduler.service';

const DEMO_EMAIL = 'golden-path-demo@pulso.app';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const patternLearning = app.get(PatternLearningService);
  const riskEngine = app.get(RiskEngineService);
  const scheduler = app.get(SchedulerService);

  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash,
      timezone: 'UTC',
      quitMotivation: 'quiero recuperar tiempo y energía para mi familia',
      consent: { create: { patternLearningConsent: true, consentedAt: new Date() } },
      // quietHoursStart === quietHoursEnd disables the quiet-hours window entirely (see
      // isWithinQuietHours) — done here only so this demo isn't at the mercy of what real
      // wall-clock hour it happens to be run at. Quiet-hours suppression itself is already
      // covered by its own unit tests in notification-decision.spec.ts.
      privacySettings: { create: { quietHoursStart: 0, quietHoursEnd: 0 } },
      riskProfile: { create: {} },
    },
  });

  const now = new Date();
  console.log(`Ahora (UTC): ${now.toISOString()} — hora local del usuario: ${now.getUTCHours()}h`);

  // 25 weeks of history at the exact current hour+weekday (subtracting whole weeks preserves
  // both in UTC) — builds a strong, genuine personal hotspot for timeRisk/dayRisk/historicalPatternRisk.
  const hotspotEvents = Array.from({ length: 25 }, (_, i) => {
    const occurredAt = new Date(now.getTime() - (i + 1) * WEEK_MS);
    const outcome = i % 3 === 0 ? CravingOutcome.RESISTED : CravingOutcome.SMOKED;
    return { userId: user.id, occurredAt, intensity: 7, triggers: [TriggerType.WORK_BREAK], outcome, resolvedAt: occurredAt };
  });
  await prisma.cravingEvent.createMany({ data: hotspotEvents });

  // A handful of recent (last 6 days) cravings at varied hours, driving recentCravingRisk /
  // recentRelapseRisk without being the same hotspot hour every time.
  const recentEvents = [
    { hoursAgo: 20, outcome: CravingOutcome.SMOKED },
    { hoursAgo: 44, outcome: CravingOutcome.SMOKED },
    { hoursAgo: 68, outcome: CravingOutcome.RESISTED },
    { hoursAgo: 90, outcome: CravingOutcome.SMOKED },
    { hoursAgo: 115, outcome: CravingOutcome.RESISTED },
    { hoursAgo: 140, outcome: CravingOutcome.SMOKED },
  ].map(({ hoursAgo, outcome }) => ({
    userId: user.id,
    occurredAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
    intensity: 6,
    triggers: [TriggerType.STRESS],
    outcome,
    resolvedAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
  }));
  await prisma.cravingEvent.createMany({ data: recentEvents });

  // Smoking events spaced ~150min apart, the last one ~170min ago (just past the personal
  // average interval, driving smokingIntervalRisk up) but well outside the 20-minute
  // "just smoked" suppression window.
  const intervalMinutes = 150;
  const smokingEvents = Array.from({ length: 12 }, (_, i) => ({
    userId: user.id,
    occurredAt: new Date(now.getTime() - 170 * 60_000 - i * intervalMinutes * 60_000),
  }));
  await prisma.smokingEvent.createMany({ data: smokingEvents });

  await patternLearning.recomputeUserRiskProfile(user.id);

  const risk = await riskEngine.assessUser(user.id, { now });
  console.log('\n=== Risk assessment (motor real, datos reales recomputados) ===');
  console.log(JSON.stringify(risk, null, 2));

  console.log('\n=== Pipeline completo (risk-engine -> notification-intelligence -> push) ===');
  const pipeline = await scheduler.runPipelineForUser(user.id, now);
  console.log('Decisión:', pipeline.evaluation.decision);
  if (pipeline.evaluation.notification) {
    console.log('Notificación creada:');
    console.log(`  alertLevel: ${pipeline.evaluation.notification.alertLevel}`);
    console.log(`  categoría:  ${pipeline.evaluation.notification.category}`);
    console.log(`  texto:      "${pipeline.evaluation.notification.renderedText}"`);
  } else {
    console.log('(No se envió notificación — ver "reason" en la decisión.)');
  }

  console.log(`\nDemo user: ${DEMO_EMAIL} / demo1234 (userId=${user.id})`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
