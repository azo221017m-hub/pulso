import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { getLungVisualState } from '@pulso/shared';
import { Lungs } from './Lungs';
import { useLungProgress } from './useLungProgress';
import { useReduceMotion } from './useReduceMotion';
import { useMilestoneCelebration } from './useMilestoneCelebration';

export function LungProgressCard() {
  const router = useRouter();
  const { data, loading } = useLungProgress();
  const reduceMotion = useReduceMotion();
  const { newlyUnlocked, dismiss } = useMilestoneCelebration(data?.daysSmokeFree);

  if (loading || !data) return null;

  const visual = getLungVisualState(data.daysSmokeFree);
  const displayWeek = data.currentWeek + 1;

  return (
    <View style={styles.card}>
      {newlyUnlocked && (
        <Pressable style={styles.celebration} onPress={dismiss}>
          <Text style={styles.celebrationText}>
            🎉 ¡Nuevo hito desbloqueado! {newlyUnlocked.emoji} {newlyUnlocked.label}
          </Text>
        </Pressable>
      )}

      <Text style={styles.title}>MIS PULMONES</Text>

      <Lungs
        size={110}
        progressRatio={visual.progressRatio}
        smokeOpacity={visual.smokeOpacity}
        particleCount={visual.particleCount}
        breathingSpeed={visual.breathingSpeed}
        reduceMotion={reduceMotion}
      />

      <Text style={styles.days}>{data.daysSmokeFree} días limpio</Text>
      <Text style={styles.week}>{displayWeek <= 4 ? `Semana ${displayWeek} de 4` : `Semana ${displayWeek}`}</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(visual.progressRatio * 100)}%` }]} />
      </View>

      <Text style={styles.avoided}>{data.cigarettesAvoided} cigarrillos evitados</Text>

      <Pressable style={styles.button} onPress={() => router.push('/evolution')}>
        <Text style={styles.buttonText}>Ver mi evolución</Text>
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
  celebration: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  celebrationText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  title: { fontSize: 13, fontWeight: '700', opacity: 0.55, letterSpacing: 1 },
  days: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  week: { fontSize: 14, opacity: 0.65 },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E1E6EF',
    overflow: 'hidden',
    marginTop: 8,
  },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: '#2F5D8A' },
  avoided: { fontSize: 13, opacity: 0.65, marginTop: 6 },
  button: {
    marginTop: 10,
    backgroundColor: '#2F5D8A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
