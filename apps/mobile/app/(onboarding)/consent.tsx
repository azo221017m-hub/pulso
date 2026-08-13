import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';

const DATA_ITEMS = [
  'Hora habitual de consumo y de cravings',
  'Frecuencia e intervalos entre cigarrillos',
  'Detonantes que registras',
  'Resultados de cada momento e intervención',
];

export default function ConsentScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function proceed(consent: boolean) {
    setSubmitting(true);
    try {
      await api.put('/privacy/consent', { patternLearningConsent: consent });
    } finally {
      setSubmitting(false);
      router.push('/(onboarding)/motivation');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>PULSO aprende, no vigila</Text>
      <Text style={styles.paragraph}>
        Con tu permiso, PULSO va a observar algunos patrones para intentar acompañarte antes de que un momento
        difícil te tome por sorpresa.
      </Text>

      <View style={styles.list}>
        {DATA_ITEMS.map((item) => (
          <Text key={item} style={styles.listItem}>
            •  {item}
          </Text>
        ))}
      </View>

      <Text style={styles.paragraph}>
        PULSO aprende tus patrones para ayudarte, no para juzgarte. Puedes desactivar esto en cualquier momento
        desde Ajustes, y siempre puedes borrar tu historial o tu cuenta.
      </Text>

      <Pressable style={styles.button} onPress={() => proceed(true)} disabled={submitting}>
        <Text style={styles.buttonText}>Aceptar y continuar</Text>
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
  list: { gap: 6, marginVertical: 6 },
  listItem: { fontSize: 14, opacity: 0.75 },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { opacity: 0.6, fontWeight: '600' },
});
