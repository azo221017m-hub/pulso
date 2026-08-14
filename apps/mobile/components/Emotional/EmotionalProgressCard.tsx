import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { Brain } from '@/components/EmotionalBrain';
import { useReduceMotion } from '@/components/LungProgress';
import { EmotionalColorKey, getEmotionalVisualState, NIVELES_EMOCIONALES } from '@pulso/shared';

interface DiaTimeline {
  fecha: string;
  conDatos: boolean;
  color: string | null;
  emocionPredominante: { nombre: string; icono: string } | null;
}

interface EvolucionResponse {
  timeline: DiaTimeline[];
  hoy: DiaTimeline;
}

function nivelDeColor(color: string | null) {
  return NIVELES_EMOCIONALES.find((n) => n.color === color) ?? NIVELES_EMOCIONALES[0];
}

export function EmotionalProgressCard() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const [data, setData] = useState<EvolucionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<EvolucionResponse>('/emotional/evolucion?rango=semana')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <View style={styles.card}>
        <ActivityIndicator />
      </View>
    );
  }

  const hoy = data.hoy;
  const nivelHoy = nivelDeColor(hoy.color);
  const visualHoy = getEmotionalVisualState((hoy.color as EmotionalColorKey) ?? 'verde', nivelHoy.nivel);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>MI ESTADO EMOCIONAL</Text>

      <Brain
        fillColor={visualHoy.fillColor}
        activation={visualHoy.activation}
        pulseSpeedMs={visualHoy.pulseSpeedMs}
        size={110}
        reduceMotion={reduceMotion}
      />

      <Text style={styles.estado}>
        {nivelHoy.nombre}
        {hoy.emocionPredominante ? ` — ${hoy.emocionPredominante.icono} ${hoy.emocionPredominante.nombre}` : ''}
      </Text>
      {!hoy.conDatos && <Text style={styles.sinDatos}>Aún no registras ningún momento hoy.</Text>}

      <Pressable style={styles.button} onPress={() => router.push('/emotional-evolution')}>
        <Text style={styles.buttonText}>Ver mi evolución emocional</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F6FA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  title: { fontSize: 13, fontWeight: '700', opacity: 0.55, letterSpacing: 1 },
  estado: { fontSize: 16, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  sinDatos: { fontSize: 13, opacity: 0.6 },
  button: {
    marginTop: 10,
    backgroundColor: '#2F5D8A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
