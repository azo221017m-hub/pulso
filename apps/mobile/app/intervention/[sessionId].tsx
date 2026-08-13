import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';

interface InterventionSessionDto {
  id: string;
  durationSeconds: number;
}

const DEFAULT_MESSAGE =
  'PULSO ESTÁ CONTIGO\n\nEste suele ser uno de tus momentos más difíciles.\n\nNo tomes ninguna decisión durante los próximos 5 minutos.';

type Phase = 'loading' | 'timer' | 'mood' | 'done';

export default function InterventionScreen() {
  const { sessionId, notificationId, cravingEventId, message } = useLocalSearchParams<{
    sessionId: string;
    notificationId?: string;
    cravingEventId?: string;
    message?: string;
  }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [realId, setRealId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      if (sessionId && sessionId !== 'new') {
        setRealId(sessionId);
        setPhase('timer');
        return;
      }
      const session = await api.post<InterventionSessionDto>('/interventions', {
        notificationId: notificationId || undefined,
        cravingEventId: cravingEventId || undefined,
      });
      setRealId(session.id);
      setSecondsLeft(session.durationSeconds);
      setPhase('timer');
    })();
  }, []);

  useEffect(() => {
    if (phase !== 'timer') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase('mood');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  async function chooseMood(mood: 'BETTER' | 'SAME' | 'NEED_HELP') {
    if (!realId) return;
    await api.patch(`/interventions/${realId}/complete`, { moodCheck: mood });
    setPhase('done');
    setTimeout(() => router.replace('/(tabs)/home'), 1200);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (phase === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Preparando este espacio para ti...</Text>
      </View>
    );
  }

  if (phase === 'timer') {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{message ?? DEFAULT_MESSAGE}</Text>
        <Text style={styles.timer}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.hint}>Solo quédate aquí. No tienes que decidir nada todavía.</Text>
        <Pressable style={styles.skipButton} onPress={() => setPhase('mood')}>
          <Text style={styles.skipButtonText}>Ya estoy mejor</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'mood') {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>¿Cómo estás?</Text>
        <View style={styles.moodRow}>
          <Pressable style={styles.moodButton} onPress={() => chooseMood('BETTER')}>
            <Text style={styles.moodEmoji}>😌</Text>
            <Text style={styles.moodLabel}>Mejor</Text>
          </Pressable>
          <Pressable style={styles.moodButton} onPress={() => chooseMood('SAME')}>
            <Text style={styles.moodEmoji}>😐</Text>
            <Text style={styles.moodLabel}>Igual</Text>
          </Pressable>
          <Pressable style={styles.moodButton} onPress={() => chooseMood('NEED_HELP')}>
            <Text style={styles.moodEmoji}>🔥</Text>
            <Text style={styles.moodLabel}>Necesito ayuda</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Gracias por quedarte aquí. PULSO sigue contigo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  message: { fontSize: 18, textAlign: 'center', lineHeight: 26, fontWeight: '600' },
  timer: { fontSize: 56, fontWeight: '800', letterSpacing: 2 },
  hint: { fontSize: 14, opacity: 0.6, textAlign: 'center' },
  skipButton: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 18 },
  skipButtonText: { opacity: 0.5, fontWeight: '600' },
  moodRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  moodButton: { alignItems: 'center', gap: 6 },
  moodEmoji: { fontSize: 40 },
  moodLabel: { fontSize: 13, opacity: 0.7 },
});
