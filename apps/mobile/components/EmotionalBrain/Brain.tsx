import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Silueta estilizada y amigable de un cerebro — no anatómicamente literal (spec §25: "NO
// representar daño cerebral real").
const BRAIN_PATH =
  'M100,20 C60,20 35,45 35,75 C20,80 15,105 28,120 C22,135 32,155 50,158 C55,172 75,180 90,172 C95,178 110,178 115,172 C130,182 152,172 155,155 C172,150 178,128 165,115 C175,98 168,72 148,65 C145,42 122,20 100,20 Z';

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
