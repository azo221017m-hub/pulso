import { useEffect } from 'react';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// One lobe, drawn pointing right from the trachea; the left lobe reuses this path mirrored.
const LOBE_PATH =
  'M0,0 C-25,-10 -45,10 -48,45 C-51,85 -40,130 -15,150 C5,165 25,155 28,125 C32,85 25,35 0,0 Z';

const UNHEALTHY_COLOR = '#5c534a';
const HEALTHY_COLOR = '#e8879f';
const MAX_PARTICLES = 8;

interface LungsProps {
  /** 0 (day zero) - 1 (plateau). Drives color, smoke, and breathing rate. */
  progressRatio: number;
  smokeOpacity: number;
  particleCount: number;
  breathingSpeed: number;
  size?: number;
  /** Static, non-looping render for low-end devices — spec §16. */
  reduceMotion?: boolean;
  /** Overrides the "healthy" end of the color interpolation — e.g. green for the daily Home state. */
  healthyColor?: string;
}

export function Lungs({
  progressRatio,
  smokeOpacity,
  particleCount,
  breathingSpeed,
  size = 160,
  reduceMotion = false,
  healthyColor = HEALTHY_COLOR,
}: LungsProps) {
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      breath.value = 0;
      return;
    }
    const duration = 1800 / breathingSpeed;
    breath.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [breath, breathingSpeed, reduceMotion]);

  const lungsAnimatedProps = useAnimatedProps(() => {
    const scale = 1 + breath.value * 0.045;
    return {
      transform: `scale(${scale})`,
      fill: interpolateColor(progressRatio, [0, 1], [UNHEALTHY_COLOR, healthyColor]),
    } as any;
  });

  return (
    <Svg viewBox="0 0 200 220" width={size} height={size}>
      <G x={100} y={60}>
        <Path d="M-8,-60 L-8,-20 Q-8,-10 0,-10 Q8,-10 8,-20 L8,-60 Z" fill="#c9b9a8" opacity={0.9} />
        <Path d="M-8,-20 L-45,10" stroke="#c9b9a8" strokeWidth={5} strokeLinecap="round" fill="none" />
        <Path d="M8,-20 L45,10" stroke="#c9b9a8" strokeWidth={5} strokeLinecap="round" fill="none" />

        <AnimatedG animatedProps={lungsAnimatedProps}>
          <Path d={LOBE_PATH} transform="translate(-40,0) scale(-1,1)" />
          <Path d={LOBE_PATH} transform="translate(40,0)" />
        </AnimatedG>

        {Array.from({ length: MAX_PARTICLES }).map((_, i) => (
          <SmokeParticle
            key={i}
            index={i}
            active={i < particleCount}
            maxOpacity={smokeOpacity}
            reduceMotion={reduceMotion}
          />
        ))}
      </G>
    </Svg>
  );
}

function SmokeParticle({
  index,
  active,
  maxOpacity,
  reduceMotion,
}: {
  index: number;
  active: boolean;
  maxOpacity: number;
  reduceMotion: boolean;
}) {
  const drift = useSharedValue(0);
  const baseX = -30 + ((index * 37) % 60);
  const baseDelay = (index * 220) % 900;

  useEffect(() => {
    if (!active || reduceMotion) {
      drift.value = 0;
      return;
    }
    const timer = setTimeout(() => {
      drift.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false);
    }, baseDelay);
    return () => clearTimeout(timer);
  }, [active, baseDelay, drift, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    if (reduceMotion) {
      return { cy: -75, opacity: active ? maxOpacity * 0.7 : 0 } as any;
    }
    return {
      cy: -75 - drift.value * 55,
      opacity: active ? maxOpacity * (1 - drift.value) : 0,
    } as any;
  });

  if (!active && reduceMotion) return null;

  return <AnimatedCircle cx={baseX} r={5} fill="#b9bcc2" animatedProps={animatedProps} />;
}
