import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { MoneySummary } from '../../types';

interface MoneySummaryCardProps {
  summary: MoneySummary;
}

export function MoneySummaryCard({ summary }: MoneySummaryCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>Monthly Total</Text>
        <Text style={styles.amount}>${summary.monthlyTotal}</Text>
        <View style={styles.divider} />
        <Text style={styles.daysSince}>
          {summary.daysSinceLastIncome} day{summary.daysSinceLastIncome !== 1 ? 's' : ''} since last income
        </Text>
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
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.leverage,
    marginBottom: spacing.m,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.m,
  },
  daysSince: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
});
