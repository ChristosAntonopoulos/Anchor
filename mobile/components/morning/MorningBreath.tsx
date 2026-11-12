import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/designTokens';

export function MorningBreath({ enabled }: { enabled: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!enabled) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.18, duration: 4200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 4200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, scale]);

  if (!enabled) return <View style={styles.spacer} />;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    height: 48,
  },
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.primaryContainer,
    opacity: 0.7,
  },
});
