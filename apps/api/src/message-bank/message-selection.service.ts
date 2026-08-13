import { Injectable } from '@nestjs/common';
import { MessageTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ALERT_LEVEL_CATEGORIES } from '../config/notification.config';

export interface SelectedMessage {
  template: MessageTemplate;
  renderedText: string;
}

const MOTIVATION_USE_PROBABILITY = 0.3;
const DIVERSITY_HISTORY_SIZE = 10;
const RECENT_CATEGORY_EXCLUSION_WINDOW = 3;

/**
 * Picks one message for a given alert level, favoring categories/tones that haven't been
 * used recently (spec §11 "Message Diversity") and only ever filling {{stat}}/{{motivation}}
 * placeholders with real, user-provided data (spec §12 — never fabricate statistics).
 */
@Injectable()
export class MessageSelectionService {
  constructor(private readonly prisma: PrismaService) {}

  async selectMessage(
    userId: string,
    alertLevel: 1 | 2 | 3 | 4,
    quitMotivation: string | null,
    realStat?: number,
  ): Promise<SelectedMessage> {
    const allowedCategories = [...ALERT_LEVEL_CATEGORIES[alertLevel]];

    const recent = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: DIVERSITY_HISTORY_SIZE,
    });
    const lastMessageId = recent[0]?.messageTemplateId;
    const recentCategories = recent.slice(0, RECENT_CATEGORY_EXCLUSION_WINDOW).map((n) => n.category);

    const allowMotivation = !!quitMotivation && Math.random() < MOTIVATION_USE_PROBABILITY;

    const allTemplatesForLevel = await this.prisma.messageTemplate.findMany({
      where: {
        active: true,
        category: { in: allowedCategories },
        minAlertLevel: { lte: alertLevel },
        maxAlertLevel: { gte: alertLevel },
      },
    });

    const placeholderSafe = (t: MessageTemplate) =>
      (!t.supportsMotivationPlaceholder || allowMotivation) &&
      (!t.supportsStatPlaceholder || realStat !== undefined);

    // Layered fallback: prefer freshness (unused categories, not the literal last message),
    // but never end up with nothing to send just because the diversity filters were strict.
    const attempts: MessageTemplate[][] = [
      allTemplatesForLevel.filter(
        (t) => !recentCategories.includes(t.category) && t.id !== lastMessageId && placeholderSafe(t),
      ),
      allTemplatesForLevel.filter((t) => t.id !== lastMessageId && placeholderSafe(t)),
      allTemplatesForLevel.filter(placeholderSafe),
      allTemplatesForLevel,
    ];
    const pool = attempts.find((p) => p.length > 0) ?? [];
    if (pool.length === 0) {
      throw new Error(`No hay plantillas de mensaje disponibles para el nivel de alerta ${alertLevel}.`);
    }

    const categoryUsage: Record<string, number> = {};
    const toneUsage: Record<string, number> = {};
    for (const n of recent) {
      categoryUsage[n.category] = (categoryUsage[n.category] ?? 0) + 1;
      toneUsage[n.tone] = (toneUsage[n.tone] ?? 0) + 1;
    }
    const scored = pool.map((t) => ({
      template: t,
      score: (categoryUsage[t.category] ?? 0) * 2 + (toneUsage[t.tone] ?? 0),
    }));
    const minScore = Math.min(...scored.map((s) => s.score));
    const lowestUsageTier = scored.filter((s) => s.score === minScore).map((s) => s.template);

    const template = lowestUsageTier[Math.floor(Math.random() * lowestUsageTier.length)];
    const renderedText = this.render(template, quitMotivation, realStat);

    return { template, renderedText };
  }

  private render(template: MessageTemplate, quitMotivation: string | null, realStat?: number): string {
    let text = template.text;
    if (template.supportsMotivationPlaceholder && quitMotivation) {
      text = text.replace('{{motivation}}', quitMotivation);
    }
    if (template.supportsStatPlaceholder && realStat !== undefined) {
      text = text.replace('{{stat}}', String(realStat));
    }
    return text;
  }
}
