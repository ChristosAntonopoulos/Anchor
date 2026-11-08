import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../../constants/designTokens';

interface ChipOption {
  id: string;
  label: string;
}

interface ChipSelectorProps {
  label: string;
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
  multiSelect?: boolean;
  optional?: boolean;
  hint?: string;
  horizontal?: boolean;
}

export function ChipSelector({
  label,
  options,
  selected,
  onToggle,
  multiSelect = true,
  optional = false,
  hint,
  horizontal = false,
}: ChipSelectorProps) {
  const handlePress = (id: string) => {
    if (!multiSelect) {
      onToggle(id);
    } else {
      onToggle(id);
    }
  };

  const chips = options.map((opt) => {
    const isSelected = selected.includes(opt.id);
    return (
      <TouchableOpacity
        key={opt.id}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => handlePress(opt.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={opt.label}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {opt.label}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}> (optional)</Text>}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.chipsRow}>{chips}</View>
        </ScrollView>
      ) : (
        <View style={styles.chipsWrap}>{chips}</View>
      )}
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
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scroll: {
    marginHorizontal: -spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    gap: spacing.s,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.category.health + '25',
    borderColor: colors.category.health,
  },
  chipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.category.health,
  },
});
