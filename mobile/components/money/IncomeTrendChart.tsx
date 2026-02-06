import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { IncomeEntry } from '../../types';

interface IncomeTrendChartProps {
  income: IncomeEntry[];
}

export function IncomeTrendChart({ income }: IncomeTrendChartProps) {
  if (income.length === 0) {
    return null;
  }

  // Get last 7 entries for the chart
  const recentIncome = income.slice(-7);
  const maxAmount = Math.max(...recentIncome.map(i => i.amount), 1);

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.title}>Recent Income Trend</Text>
        <View style={styles.chartContainer}>
          {recentIncome.map((entry, index) => {
            const height = (entry.amount / maxAmount) * 100;
            return (
              <View key={entry.id} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient
                    colors={[colors.category.leverage, colors.category.leverage + 'CC']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.bar, { height: `${height}%` }]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {formatDate(entry.date)}
                </Text>
                <Text style={styles.barAmount}>${entry.amount}</Text>
              </View>
            );
          })}
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
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingBottom: spacing.s,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '80%',
    height: '100%',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.small,
    minHeight: 4,
  },
  barLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  barAmount: {
    fontSize: typography.fontSize.caption,
    color: colors.category.leverage,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
});
