import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';

const INTENSITY_OPTIONS = [1, 3, 5, 7, 9];

const TRIGGERS: { value: string; label: string }[] = [
  { value: 'STRESS', label: 'Estrés' },
  { value: 'AFTER_MEAL', label: 'Después de comer' },
  { value: 'SOCIAL', label: 'Situación social' },
  { value: 'ALCOHOL', label: 'Alcohol' },
  { value: 'COFFEE', label: 'Café' },
  { value: 'BOREDOM', label: 'Aburrimiento' },
  { value: 'WORK_BREAK', label: 'Descanso del trabajo' },
  { value: 'ANXIETY', label: 'Ansiedad' },
];

export default function NewCravingScreen() {
  const router = useRouter();
  const [intensity, setIntensity] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleTrigger(value: string) {
    setTriggers((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const craving = await api.post<{ id: string }>('/events/cravings', { intensity, triggers });
      router.replace({ pathname: '/craving/[id]', params: { id: craving.id } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Este momento es real.</Text>
      <Text style={styles.subtitle}>No tienes que resolverlo todavía. Solo cuéntale a PULSO qué está pasando.</Text>

      <Text style={styles.label}>¿Qué tan intenso es?</Text>
      <View style={styles.row}>
        {INTENSITY_OPTIONS.map((n) => (
          <Pressable
            key={n}
            style={[styles.chip, intensity === n && styles.chipSelected]}
            onPress={() => setIntensity(n)}>
            <Text style={[styles.chipText, intensity === n && styles.chipTextSelected]}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>¿Reconoces algún detonante? (opcional)</Text>
      <View style={styles.wrapRow}>
        {TRIGGERS.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.chip, triggers.includes(t.value) && styles.chipSelected]}
            onPress={() => toggleTrigger(t.value)}>
            <Text style={[styles.chipText, triggers.includes(t.value) && styles.chipTextSelected]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={submit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Guardando...' : 'Continuar'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, gap: 12, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.65, marginBottom: 8, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: '#2F5D8A', borderColor: '#2F5D8A' },
  chipText: { fontSize: 14 },
  chipTextSelected: { color: 'white', fontWeight: '600' },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
