import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { markOnboardingComplete } from '@/lib/onboarding';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function MotivationScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function finish() {
    setSubmitting(true);
    try {
      if (motivation.trim()) {
        await api.patch('/users/me', { quitMotivation: motivation.trim() });
        await refreshUser();
      }
      await registerForPushNotificationsAsync().catch(() => {});
      if (user) await markOnboardingComplete(user.id);
    } finally {
      setSubmitting(false);
      router.replace('/(tabs)/home');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>¿Por qué quieres hacer este cambio?</Text>
      <Text style={styles.paragraph}>
        Es completamente opcional. Si nos cuentas algo, PULSO puede usarlo ocasionalmente para recordártelo en un
        momento difícil — solo con tus propias palabras, nunca inventadas.
      </Text>

      <TextInput
        style={styles.textarea}
        placeholder="Ej: quiero recuperar tiempo y energía para mi familia..."
        multiline
        numberOfLines={4}
        value={motivation}
        onChangeText={setMotivation}
      />

      <Pressable style={styles.button} onPress={finish} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Guardando...' : 'Empezar con PULSO'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, gap: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  paragraph: { fontSize: 15, lineHeight: 22, opacity: 0.8 },
  textarea: {
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
