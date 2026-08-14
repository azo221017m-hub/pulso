import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { requestLocationPermission } from '@/lib/location';

export default function LocationOnboardingScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function proceed(pedirPermiso: boolean) {
    setSubmitting(true);
    try {
      const granted = pedirPermiso ? await requestLocationPermission() : false;
      await api.put('/privacy/settings', { locationPermissionGranted: granted }).catch(() => {});
    } finally {
      setSubmitting(false);
      router.push('/(onboarding)/motivation');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Para que podamos ayudarte más rápidamente</Text>
      <Text style={styles.paragraph}>
        Si algún día utilizas TSQ8 para pedir apoyo, ¿nos permites conocer tu ubicación? Solo se usa en ese momento —
        nunca para rastrearte.
      </Text>

      <Pressable style={styles.button} onPress={() => proceed(true)} disabled={submitting}>
        <Text style={styles.buttonText}>Permitir ubicación</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => proceed(false)} disabled={submitting}>
        <Text style={styles.secondaryButtonText}>Ahora no</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, gap: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  paragraph: { fontSize: 15, lineHeight: 22, opacity: 0.8 },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { opacity: 0.6, fontWeight: '600' },
});
