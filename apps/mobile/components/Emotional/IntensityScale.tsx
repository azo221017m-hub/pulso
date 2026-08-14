import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { EMOTIONAL_COLOR_HEX, nivelInternoParaIntensidad } from '@pulso/shared';

interface IntensityScaleProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

const NUMBERS = Array.from({ length: 11 }, (_, i) => i);

export function IntensityScale({ value, onChange, label = '¿Qué tan fuerte está esta emoción ahora?' }: IntensityScaleProps) {
  const nivel = nivelInternoParaIntensidad(value);
  const color = EMOTIONAL_COLOR_HEX[nivel.color];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {NUMBERS.map((n) => {
          const selected = n === value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[
                styles.bubble,
                selected && { backgroundColor: color, borderColor: color },
              ]}>
              <Text style={[styles.bubbleText, selected && styles.bubbleTextSelected]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.nivelText, { color }]}>{nivel.nombre}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D8DEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: { fontSize: 13, fontWeight: '600' },
  bubbleTextSelected: { color: 'white' },
  nivelText: { fontSize: 13, fontWeight: '700' },
});
