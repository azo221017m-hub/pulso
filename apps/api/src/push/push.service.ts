import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, expoPushToken: string) {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      this.logger.warn(`Token ${expoPushToken} no es un Expo push token válido, se registra igual (dev).`);
    }
    return this.prisma.pushToken.upsert({
      where: { expoPushToken },
      create: { userId, expoPushToken },
      update: { userId, lastSeenAt: new Date() },
    });
  }

  /**
   * Dispatches a push for an already-created Notification. Called by the scheduler right
   * after notification-intelligence decides to send — kept as a separate step (rather than
   * embedded inside notification-intelligence) so the decision/persistence logic stays
   * testable without a real push transport.
   */
  async sendForNotification(notification: Notification): Promise<void> {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId: notification.userId } });
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.expoPushToken))
      .map((t) => ({
        to: t.expoPushToken,
        body: notification.renderedText,
        sound: notification.alertLevel >= 3 ? 'default' : null,
        priority: notification.alertLevel >= 3 ? 'high' : 'default',
        data: {
          notificationId: notification.id,
          alertLevel: notification.alertLevel,
          category: notification.category,
        },
      }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error('Error enviando push notifications', error as Error);
      }
    }
  }
}
