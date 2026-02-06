import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { DisciplineEntry } from '../../types';

interface DisciplineQuickToggleProps {
  discipline: DisciplineEntry;
  onToggle: (key: keyof DisciplineEntry) => void;
}

const habitLabels: Record<keyof DisciplineEntry, string> = {
  gym: 'Gym',
  walk: 'Walk',
  cooked: 'Cooked',
  diet: 'Diet',
  meditation: 'Meditation',
  water: 'Water',
};

export function DisciplineQuickToggle({ discipline, onToggle }: DisciplineQuickToggleProps) {
  const habits = Object.entries(discipline) as [keyof DisciplineEntry, boolean][];
  const completedCount = habits.filter(([, completed]) => completed).length;
  const totalCount = habits.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Discipline</Text>
          <Text style={styles.count}>
            {completedCount}/{totalCount}
          </Text>
        </View>
        <View style={styles.habitsContainer}>
          {habits.map(([key, completed]) => (
            <TouchableOpacity
              key={key}
              onPress={() => onToggle(key)}
              activeOpacity={0.7}
              style={styles.habitButtonWrapper}
            >
              {completed ? (
                <LinearGradient
                  colors={[colors.category.leverage, colors.category.leverage + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.habitButtonCompleted}
                >
                  <Text style={styles.habitTextCompleted}>{habitLabels[key]}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.habitButton}>
                  <Text style={styles.habitText}>{habitLabels[key]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  frame: {
    borderRadius: borderRadius.large,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  habitButtonWrapper: {
    borderRadius: borderRadius.round,
  },
  habitButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitButtonCompleted: {
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  habitText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
  },
  habitTextCompleted: {
    fontSize: typography.fontSize.caption,
    color: colors.background,
    fontWeight: typography.fontWeight.semibold,
  },
});
