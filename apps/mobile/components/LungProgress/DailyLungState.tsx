import { Text, View } from '@/components/Themed';
import { StyleSheet } from 'react-native';
import { Lungs } from './Lungs';
import { useReduceMotion } from './useReduceMotion';
import type { TodayLungState } from '@pulso/shared';

const AVOIDED_COLOR = '#4C9A6A';

const MESSAGE: Record<'smoked' | 'avoided' | 'neutral', string> = {
  smoked: 'Hoy fumaste. Mañana es una página nueva.',
  avoided: '¡Hoy evitaste fumar! Tus pulmones lo notan.',
  neutral: '¿Cómo va tu día? Registra cómo te fue.',
};

export function DailyLungState({ state }: { state: TodayLungState | null }) {
  const reduceMotion = useReduceMotion();
  const day: 'smoked' | 'avoided' | 'neutral' = state?.smokedToday
    ? 'smoked'
    : state?.avoidedToday
      ? 'avoided'
      : 'neutral';

  const smoked = day === 'smoked';
  const avoided = day === 'avoided';

  return (
    <View style={styles.card}>
      <Lungs
        size={90}
        progressRatio={smoked ? 0 : 1}
        smokeOpacity={smoked ? 1 : 0}
        particleCount={smoked ? 8 : 0}
        breathingSpeed={smoked ? 1.6 : 1}
        healthyColor={avoided ? AVOIDED_COLOR : undefined}
        reduceMotion={reduceMotion}
      />
      <Text style={styles.message}>{MESSAGE[day]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F6FA',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  message: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
});
