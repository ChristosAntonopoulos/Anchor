import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';
import { IncomeItem } from './IncomeItem';
import type { IncomeEntry } from '../../types';

interface IncomeListProps {
  income: IncomeEntry[];
}

export function IncomeList({ income }: IncomeListProps) {
  if (income.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No income logged yet. That's okay. Keep building.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Income History</Text>
      {income.map((entry) => (
        <IncomeItem key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  emptyContainer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
