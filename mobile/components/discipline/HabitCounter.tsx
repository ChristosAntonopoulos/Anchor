import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface HabitCounterProps {
  label: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function HabitCounter({ label, count, onIncrement, onDecrement }: HabitCounterProps) {
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
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.counterContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={onDecrement}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={[styles.button, styles.decrementButton, count === 0 && styles.buttonDisabled]}
            disabled={count === 0}
          >
            <Ionicons name="remove" size={20} color={count === 0 ? colors.textSecondary : colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={onIncrement}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={[styles.button, styles.incrementButton]}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s,
  },
  label: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    // Additional styling if needed
  },
  incrementButton: {
    backgroundColor: colors.category.health + '20',
    borderColor: colors.category.health + '60',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  countContainer: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
