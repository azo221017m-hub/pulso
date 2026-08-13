import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Switch } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

interface PrivacySettingsDto {
  predictionsEnabled: boolean;
  notificationsEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

interface ConsentDto {
  patternLearningConsent: boolean;
}

interface DataSummaryDto {
  whatPulsoUses: string[];
  counts: { cravingEvents: number; smokingEvents: number; notifications: number };
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettingsDto | null>(null);
  const [consent, setConsent] = useState<ConsentDto | null>(null);
  const [summary, setSummary] = useState<DataSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([
        api.get<PrivacySettingsDto>('/privacy/settings'),
        api.get<ConsentDto>('/privacy/consent'),
        api.get<DataSummaryDto>('/privacy/data'),
      ])
        .then(([s, c, d]) => {
          if (cancelled) return;
          setSettings(s);
          setConsent(c);
          setSummary(d);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function updateSettings(patch: Partial<PrivacySettingsDto>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await api.put('/privacy/settings', patch);
  }

  async function updateConsent(patternLearningConsent: boolean) {
    setConsent({ patternLearningConsent });
    await api.put('/privacy/consent', { patternLearningConsent });
  }

  async function enableNotifications() {
    await registerForPushNotificationsAsync();
    await updateSettings({ notificationsEnabled: true });
  }

  async function exportData() {
    const data = await api.get('/privacy/export');
    await Share.share({ message: JSON.stringify(data, null, 2) });
  }

  function confirmDeleteHistory() {
    Alert.alert('Borrar historial', 'Esto elimina tus registros de cravings, cigarrillos y notificaciones. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await api.delete('/privacy/history');
          Alert.alert('Listo', 'Tu historial fue eliminado.');
        },
      },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert('Eliminar cuenta', 'Esta acción no se puede deshacer. ¿Seguro que quieres eliminar tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.delete('/privacy/account');
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (loading || !settings || !consent) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <Text style={styles.sectionTitle}>Privacidad</Text>
      <Text style={styles.sectionHint}>PULSO aprende tus patrones para ayudarte, no para juzgarte.</Text>

      <Row
        label="Aprender de mis patrones"
        value={consent.patternLearningConsent}
        onChange={updateConsent}
      />
      <Row
        label="Predicciones de riesgo"
        value={settings.predictionsEnabled}
        onChange={(v) => updateSettings({ predictionsEnabled: v })}
      />
      <Row
        label="Notificaciones"
        value={settings.notificationsEnabled}
        onChange={(v) => (v ? enableNotifications() : updateSettings({ notificationsEnabled: false }))}
      />

      <Text style={styles.sectionTitle}>Tus datos</Text>
      {summary && (
        <Text style={styles.sectionHint}>
          {summary.counts.cravingEvents} cravings · {summary.counts.smokingEvents} cigarrillos ·{' '}
          {summary.counts.notifications} notificaciones registradas.
        </Text>
      )}
      <Pressable style={styles.linkButton} onPress={exportData}>
        <Text style={styles.linkButtonText}>Exportar mis datos</Text>
      </Pressable>
      <Pressable style={styles.linkButton} onPress={confirmDeleteHistory}>
        <Text style={styles.linkButtonText}>Borrar historial</Text>
      </Pressable>
      <Pressable style={styles.linkButtonDanger} onPress={confirmDeleteAccount}>
        <Text style={styles.linkButtonDangerText}>Eliminar cuenta</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  email: { opacity: 0.6, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 18 },
  sectionHint: { fontSize: 13, opacity: 0.6, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 15 },
  linkButton: { paddingVertical: 10 },
  linkButtonText: { color: '#2F5D8A', fontSize: 15, fontWeight: '600' },
  linkButtonDanger: { paddingVertical: 10 },
  linkButtonDangerText: { color: '#C24545', fontSize: 15, fontWeight: '600' },
  logoutButton: { marginTop: 24, paddingVertical: 14, alignItems: 'center' },
  logoutButtonText: { opacity: 0.6, fontWeight: '600' },
});
