import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Silueta estilizada y amigable de un cerebro — no anatómicamente literal (spec §25: "NO
// representar daño cerebral real"). Incluye cerebro, cerebelo y bulbo raquídeo como formas
// reconocibles pero simples, sin buscar precisión anatómica.
const BRAIN_PATH =
  // Cerebro (lóbulos superiores)
  'M100,18 C62,18 38,42 36,70 C22,74 16,96 26,112 C20,124 26,140 42,146 C46,156 60,164 74,160 C80,166 92,168 100,164 C108,168 118,166 122,160 C132,166 146,160 150,150 C160,148 166,138 162,128 C170,118 168,100 156,92 C156,64 130,18 100,18 Z ' +
  // Cerebelo (lóbulo inferior posterior, borde ondulado)
  'M136,140 C146,136 158,140 162,150 C170,152 172,164 164,170 C166,178 158,184 150,182 C144,188 134,186 130,180 C122,182 116,174 120,166 C114,160 118,150 126,148 C128,142 132,140 136,140 Z ' +
  // Bulbo raquídeo / tallo cerebral
  'M94,158 C91,158 89,161 90,165 L93,188 C94,194 106,194 107,188 L110,165 C111,161 109,158 106,158 Z';

interface BrainProps {
  fillColor: string;
  /** 0 (quieto) - 1 (muy activo). */
  activation: number;
  pulseSpeedMs: number;
  size?: number;
  reduceMotion?: boolean;
}

export function Brain({ fillColor, activation, pulseSpeedMs, size = 160, reduceMotion = false }: BrainProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: pulseSpeedMs, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse, pulseSpeedMs, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    const amplitude = 0.02 + activation * 0.05;
    const scale = 1 + pulse.value * amplitude;
    return { transform: `scale(${scale})` } as any;
  });

  return (
    <Svg viewBox="0 0 200 200" width={size} height={size}>
      <AnimatedPath d={BRAIN_PATH} fill={fillColor} animatedProps={animatedProps} />
    </Svg>
  );
}
