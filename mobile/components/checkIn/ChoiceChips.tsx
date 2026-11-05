import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface Choice {
  code: string;
  label: string;
}

interface ChoiceChipsProps {
  options: Choice[];
  selected: string[];
  onToggle: (code: string) => void;
  accessibilityLabel: string;
}

export function ChoiceChips({ options, selected, onToggle, accessibilityLabel }: ChoiceChipsProps) {
  return (
    <View style={styles.wrap} accessibilityRole="list" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const isSelected = selected.includes(option.code);
        return (
          <Pressable
            key={option.code}
            onPress={() => onToggle(option.code)}
            accessibilityRole="button"
            accessibilityLabel={isSelected ? `${option.label}. Selected` : option.label}
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
            {isSelected ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  chip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderControl,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
  },
  labelSelected: {
    fontWeight: typography.fontWeight.semibold,
  },
  check: {
    color: colors.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});
