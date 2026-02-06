import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface HabitToggleProps {
  label: string;
  completed: boolean;
  onToggle: () => void;
}

export function HabitToggle({ label, completed, onToggle }: HabitToggleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.wrapper}
      >
      {completed ? (
        <LinearGradient
          colors={[colors.category.leverage, colors.category.leverage + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonCompleted}
        >
          <Text style={styles.textCompleted}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.button}>
          <Text style={styles.text}>{label}</Text>
        </View>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.round,
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonCompleted: {
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  text: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  textCompleted: {
    fontSize: typography.fontSize.body,
    color: colors.background,
    fontWeight: typography.fontWeight.semibold,
  },
});
