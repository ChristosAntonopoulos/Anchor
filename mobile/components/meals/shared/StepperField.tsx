import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../constants/designTokens';

interface StepperFieldProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  unit?: string;
  optional?: boolean;
}

export function StepperField({
  label,
  value,
  onDecrement,
  onIncrement,
  min = 1,
  max = 20,
  unit,
  optional = false,
}: StepperFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}> (Προαιρετικό)</Text>}
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, value <= min && styles.btnDisabled]}
          onPress={onDecrement}
          disabled={value <= min}
          accessibilityLabel="Μείωση"
        >
          <Ionicons name="remove" size={20} color={value <= min ? colors.border : colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.btn, value >= max && styles.btnDisabled]}
          onPress={onIncrement}
          disabled={value >= max}
          accessibilityLabel="Αύξηση"
        >
          <Ionicons name="add" size={20} color={value >= max ? colors.border : colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optional: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.l,
    gap: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  unit: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
