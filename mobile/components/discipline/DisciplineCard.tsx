import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { HabitToggle } from './HabitToggle';
import type { DisciplineEntry } from '../../types';

interface DisciplineCardProps {
  discipline: DisciplineEntry;
  onToggle: (key: keyof DisciplineEntry) => void;
  weeklyInsight?: string;
}

const habitLabels: Record<keyof DisciplineEntry, string> = {
  gym: 'Gym',
  walk: 'Walk',
  cooked: 'Cooked',
  diet: 'Diet',
  meditation: 'Meditation',
  water: 'Water',
};

export function DisciplineCard({ discipline, onToggle, weeklyInsight }: DisciplineCardProps) {
  const habits = Object.entries(discipline) as [keyof DisciplineEntry, boolean][];
  const completedCount = habits.filter(([, completed]) => completed).length;
  const totalCount = habits.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Discipline</Text>
          <Text style={styles.count}>
            {completedCount}/{totalCount}
          </Text>
        </View>
        {weeklyInsight && (
          <View style={styles.insightContainer}>
            <View style={styles.insightIcon}>
              <Text style={styles.insightIconText}>💡</Text>
            </View>
            <Text style={styles.insightText}>{weeklyInsight}</Text>
          </View>
        )}
        <View style={styles.habitsContainer}>
          {habits.map(([key, completed]) => (
            <HabitToggle
              key={key}
              label={habitLabels[key]}
              completed={completed}
              onToggle={() => onToggle(key)}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.category.health + '40',
  },
  insightIcon: {
    marginRight: spacing.s,
  },
  insightIconText: {
    fontSize: 20,
  },
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
});
