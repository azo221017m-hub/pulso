import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { RiskAssessment } from '@pulso/shared';

interface NotificationDto {
  id: string;
  alertLevel: number;
  renderedText: string;
  openedAt: string | null;
  sentAt: string;
}

const BAND_LABEL: Record<string, string> = {
  LOW: 'Bajo',
  MODERATE: 'Moderado',
  HIGH: 'Alto',
  VERY_HIGH: 'Muy alto',
};

const BAND_COLOR: Record<string, string> = {
  LOW: '#4C9A6A',
  MODERATE: '#C9971F',
  HIGH: '#D97B3F',
  VERY_HIGH: '#C24545',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [banner, setBanner] = useState<NotificationDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [riskRes, notifications] = await Promise.all([
        api.get<RiskAssessment>('/risk/me'),
        api.get<NotificationDto[]>('/notifications'),
      ]);
      setRisk(riskRes);
      const recentUnopened = notifications.find(
        (n) => !n.openedAt && Date.now() - new Date(n.sentAt).getTime() < 2 * 60 * 60 * 1000,
      );
      setBanner(recentUnopened ?? null);
    } catch {
      // best-effort — home should still render the primary actions even if this fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function dismissBanner() {
    if (!banner) return;
    await api.post(`/notifications/${banner.id}/open`).catch(() => {});
    setBanner(null);
  }

  async function acceptBanner() {
    if (!banner) return;
    await api.post(`/notifications/${banner.id}/open`).catch(() => {});
    router.push({ pathname: '/intervention/[sessionId]', params: { sessionId: 'new', notificationId: banner.id } });
  }

  async function logSmoking() {
    await api.post('/events/smoking', {});
    load();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{user?.email ? `Hola.` : 'Hola.'}</Text>
      <Text style={styles.subtitle}>PULSO está aquí contigo.</Text>

      {banner && (
        <View style={[styles.banner, banner.alertLevel >= 4 && styles.bannerUrgent]}>
          <Text style={styles.bannerText}>{banner.renderedText}</Text>
          <View style={styles.bannerActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={acceptBanner}>
              <Text style={styles.primaryButtonText}>
                {banner.alertLevel >= 3 ? '🫁 Acompáñame 5 min' : 'Sí, acompáñame'}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={dismissBanner}>
              <Text style={styles.secondaryButtonText}>Ahora no</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!loading && risk && (
        <View style={styles.riskPill}>
          <View style={[styles.riskDot, { backgroundColor: BAND_COLOR[risk.band] }]} />
          <Text style={styles.riskText}>Momento actual: {BAND_LABEL[risk.band]}</Text>
        </View>
      )}
      {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}

      <Pressable style={styles.cravingButton} onPress={() => router.push('/craving/new')}>
        <Text style={styles.cravingButtonText}>Tengo ganas</Text>
      </Pressable>

      <Pressable
        style={styles.interventionButton}
        onPress={() => router.push({ pathname: '/intervention/[sessionId]', params: { sessionId: 'new' } })}>
        <Text style={styles.interventionButtonText}>🫁 Acompáñame 5 minutos</Text>
      </Pressable>

      <Pressable style={styles.smokedButton} onPress={logSmoking}>
        <Text style={styles.smokedButtonText}>Ya fumé</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  greeting: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 15, opacity: 0.7, marginBottom: 6 },
  banner: {
    backgroundColor: '#EEF3FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bannerUrgent: { backgroundColor: '#FDECEC' },
  bannerText: { fontSize: 16, lineHeight: 22 },
  bannerActions: { flexDirection: 'row', gap: 10 },
  primaryButtonSmall: { backgroundColor: '#2F5D8A', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  primaryButtonText: { color: 'white', fontWeight: '600' },
  secondaryButtonSmall: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  secondaryButtonText: { opacity: 0.6, fontWeight: '600' },
  riskPill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskText: { fontSize: 13, opacity: 0.7 },
  cravingButton: {
    backgroundColor: '#2F5D8A',
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  cravingButtonText: { color: 'white', fontSize: 20, fontWeight: '700' },
  interventionButton: {
    borderWidth: 1.5,
    borderColor: '#2F5D8A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  interventionButtonText: { color: '#2F5D8A', fontSize: 16, fontWeight: '600' },
  smokedButton: { paddingVertical: 12, alignItems: 'center' },
  smokedButtonText: { opacity: 0.5, fontSize: 14 },
});
