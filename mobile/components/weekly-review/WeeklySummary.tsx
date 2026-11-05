import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface WeeklySummaryProps {
  summary: string;
  report?: string;
  adjustment?: string;
  adjustmentWhy?: string;
}

export function WeeklySummary({ summary, report, adjustment, adjustmentWhy }: WeeklySummaryProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>AI Summary</Text>
        <View style={styles.divider} />
        <Text style={styles.summary}>{summary}</Text>

        {!!report && (
          <>
            <Text style={styles.subLabel}>Report</Text>
            <Text style={styles.detail}>{report}</Text>
          </>
        )}

        {!!adjustment && (
          <>
            <Text style={styles.subLabel}>Adjustment</Text>
            <Text style={styles.detail}>{adjustment}</Text>
          </>
        )}

        {!!adjustmentWhy && (
          <>
            <Text style={styles.subLabel}>Why</Text>
            <Text style={styles.detail}>{adjustmentWhy}</Text>
          </>
        )}
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
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.m,
  },
  summary: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.body,
  },
  subLabel: {
    marginTop: spacing.m,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  detail: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.body,
  },
});
