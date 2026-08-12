import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ParticleSpec {
  emoji: string;
  x: number;
  y: number;
  delay: number;
  rotate: string;
}

/** 星星/粒子：从底部中央向四周弹出，随后淡出（策划书 §2.6 撒花，当日一次） */
const PARTICLES: ParticleSpec[] = [
  { emoji: '⭐', x: -110, y: -170, delay: 0, rotate: '-40deg' },
  { emoji: '✨', x: 0, y: -210, delay: 120, rotate: '0deg' },
  { emoji: '🌟', x: 110, y: -170, delay: 60, rotate: '40deg' },
  { emoji: '🎉', x: -70, y: -120, delay: 180, rotate: '-20deg' },
  { emoji: '💫', x: 70, y: -120, delay: 240, rotate: '20deg' },
  { emoji: '✨', x: -160, y: -90, delay: 300, rotate: '-60deg' },
  { emoji: '⭐', x: 160, y: -90, delay: 200, rotate: '60deg' },
  { emoji: '🎊', x: 0, y: -150, delay: 360, rotate: '10deg' },
];

interface Props {
  visible: boolean;
  onFinish: () => void;
}

export default function Confetti({ visible, onFinish }: Props) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onFinish, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onFinish]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={styles.container}>
      {PARTICLES.map((p, i) => (
        <Particle key={i} spec={p} />
      ))}
    </Animated.View>
  );
}

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withSequence(
        withTiming(1, { duration: 450 }),
        withDelay(700, withTiming(0, { duration: 500 }))
      )
    );
  }, [progress, spec.delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: spec.x * progress.value },
      { translateY: spec.y * progress.value },
      { rotate: spec.rotate },
      { scale: 0.4 + progress.value * 0.9 },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.emoji}>{spec.emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 140,
  },
  particle: {
    position: 'absolute',
  },
  emoji: {
    fontSize: 28,
  },
});
