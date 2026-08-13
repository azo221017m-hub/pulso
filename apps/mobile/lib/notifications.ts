import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) return; // push tokens don't work on simulators/emulators

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PULSO',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
  await api.post('/push/tokens', { expoPushToken });
}

interface NotificationTapPayload {
  notificationId?: string;
  alertLevel?: number;
}

/** Routes the user straight into intervention mode for level 3-4 taps, per spec §14. */
export function useNotificationResponseRouting() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationTapPayload;
      if (!data?.notificationId) return;

      api.post(`/notifications/${data.notificationId}/open`).catch(() => {});

      if (data.alertLevel && data.alertLevel >= 3) {
        router.push({
          pathname: '/intervention/[sessionId]',
          params: { sessionId: 'new', notificationId: data.notificationId },
        });
      } else {
        router.push('/(tabs)/home');
      }
    });
    return () => subscription.remove();
  }, [router]);
}
