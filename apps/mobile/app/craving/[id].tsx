import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';

const STRATEGIES: { value: string; label: string }[] = [
  { value: 'BREATHING', label: 'Respirar' },
  { value: 'WALK', label: 'Caminar' },
  { value: 'DRINK_WATER', label: 'Tomar agua' },
  { value: 'CALL_SOMEONE', label: 'Llamar a alguien' },
  { value: 'DISTRACTION', label: 'Distraerme' },
  { value: 'DELAY_10_MIN', label: 'Esperar 10 min' },
  { value: 'CRAVING_SURF', label: 'Dejar pasar la ola' },
];

export default function ResolveCravingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [strategy, setStrategy] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function resolve(outcome: 'RESISTED' | 'SMOKED') {
    setSubmitting(true);
    try {
      await api.patch(`/events/cravings/${id}`, {
        outcome,
        strategy: strategy ?? undefined,
      });
      router.replace('/habits');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>¿Qué pasó con este momento?</Text>
      <Text style={styles.subtitle}>No hay una respuesta correcta. Solo cuéntale a PULSO qué eligiste.</Text>

      <Text style={styles.label}>¿Usaste alguna estrategia? (opcional)</Text>
      <View style={styles.wrapRow}>
        {STRATEGIES.map((s) => (
          <Pressable
            key={s.value}
            style={[styles.chip, strategy === s.value && styles.chipSelected]}
            onPress={() => setStrategy(strategy === s.value ? null : s.value)}>
            <Text style={[styles.chipText, strategy === s.value && styles.chipTextSelected]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.resistedButton} onPress={() => resolve('RESISTED')} disabled={submitting}>
        <Text style={styles.resistedButtonText}>Lo superé</Text>
      </Pressable>
      <Pressable style={styles.smokedButton} onPress={() => resolve('SMOKED')} disabled={submitting}>
        <Text style={styles.smokedButtonText}>Fumé</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, gap: 12, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.65, marginBottom: 8, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#D8DEE8', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipSelected: { backgroundColor: '#2F5D8A', borderColor: '#2F5D8A' },
  chipText: { fontSize: 14 },
  chipTextSelected: { color: 'white', fontWeight: '600' },
  resistedButton: {
    backgroundColor: '#4C9A6A',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  resistedButtonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  smokedButton: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  smokedButtonText: { opacity: 0.5, fontSize: 15, fontWeight: '600' },
});
