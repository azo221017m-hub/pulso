import { MessageCategory, MessageTemplate, Tone } from '@prisma/client';
import { MessageSelectionService } from './message-selection.service';

function template(overrides: Partial<MessageTemplate>): MessageTemplate {
  return {
    id: overrides.id ?? 'tpl',
    category: MessageCategory.compania,
    tone: Tone.CALIDO,
    minAlertLevel: 1,
    maxAlertLevel: 1,
    text: 'texto genérico',
    supportsMotivationPlaceholder: false,
    supportsStatPlaceholder: false,
    active: true,
    createdAt: new Date(),
    ...overrides,
  } as MessageTemplate;
}

const LEVEL_1_TEMPLATES: MessageTemplate[] = [
  template({ id: 'companionship-1', category: MessageCategory.compania, text: 'PULSO está aquí contigo.' }),
  template({ id: 'encouragement-1', category: MessageCategory.animo, text: 'Lo estás haciendo mejor de lo que crees.' }),
  template({ id: 'empathy-1', category: MessageCategory.empatia, text: 'Está bien si esto pesa ahora.' }),
  template({ id: 'reflection-1', category: MessageCategory.reflexion, text: 'Cuida este momento.' }),
  template({ id: 'reminder-1', category: MessageCategory.recordatorio, text: 'Esto también va a pasar.' }),
  template({
    id: 'reflection-stat',
    category: MessageCategory.reflexion,
    text: 'Hoy ya atravesaste {{stat}} momentos.',
    supportsStatPlaceholder: true,
  }),
  template({
    id: 'companionship-motivation',
    category: MessageCategory.compania,
    text: '{{motivation}}. Eso también cuenta hoy.',
    supportsMotivationPlaceholder: true,
  }),
];

function buildService(notifications: { category: MessageCategory; tone: Tone; messageTemplateId: string }[]) {
  const fakePrisma = {
    notification: {
      findMany: async () => notifications.map((n) => ({ ...n, sentAt: new Date() })),
    },
    messageTemplate: {
      findMany: async () => LEVEL_1_TEMPLATES,
    },
  };
  return new MessageSelectionService(fakePrisma as any);
}

describe('MessageSelectionService', () => {
  it('never fills {{stat}} with a fabricated number and never leaves it unfilled', async () => {
    const service = buildService([]);
    for (let i = 0; i < 30; i++) {
      const { renderedText } = await service.selectMessage('user-1', 1, null, undefined);
      expect(renderedText).not.toContain('{{stat}}');
    }
  });

  it('only uses a real stat when explicitly provided', async () => {
    const service = buildService([]);
    let sawStatTemplate = false;
    for (let i = 0; i < 100; i++) {
      const { template: t, renderedText } = await service.selectMessage('user-1', 1, null, 4);
      if (t.id === 'reflection-stat') {
        sawStatTemplate = true;
        expect(renderedText).toBe('Hoy ya atravesaste 4 momentos.');
      }
    }
    expect(sawStatTemplate).toBe(true);
  });

  it('never leaves {{motivation}} unfilled and never fills it when the user gave none', async () => {
    const service = buildService([]);
    for (let i = 0; i < 30; i++) {
      const { renderedText } = await service.selectMessage('user-1', 1, null);
      expect(renderedText).not.toContain('{{motivation}}');
    }
  });

  it('avoids repeating a category used in the last 3 notifications when alternatives exist', async () => {
    const service = buildService([
      { category: MessageCategory.compania, tone: Tone.CALIDO, messageTemplateId: 'companionship-1' },
      { category: MessageCategory.compania, tone: Tone.CALIDO, messageTemplateId: 'companionship-1' },
      { category: MessageCategory.compania, tone: Tone.CALIDO, messageTemplateId: 'companionship-1' },
    ]);
    for (let i = 0; i < 20; i++) {
      const { template: t } = await service.selectMessage('user-1', 1, null);
      expect(t.category).not.toBe(MessageCategory.compania);
    }
  });

  it('never repeats the exact last message id when an alternative exists', async () => {
    const service = buildService([
      { category: MessageCategory.animo, tone: Tone.CALIDO, messageTemplateId: 'encouragement-1' },
    ]);
    for (let i = 0; i < 20; i++) {
      const { template: t } = await service.selectMessage('user-1', 1, null);
      expect(t.id).not.toBe('encouragement-1');
    }
  });
});
