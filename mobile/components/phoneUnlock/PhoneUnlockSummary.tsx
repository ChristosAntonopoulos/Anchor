import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import {
  UNLOCK_COPY,
  formatUnlockedDuration,
  summarizeUnlockEntries,
  type IntentionCode,
} from '../../utils/phoneUnlockMapping';
import type { PhoneUnlockEntry } from '../../types';

interface PhoneUnlockSummaryProps {
  entries: PhoneUnlockEntry[];
}

export function PhoneUnlockSummary({ entries }: PhoneUnlockSummaryProps) {
  const stats = summarizeUnlockEntries(entries);
  const mostOften =
    stats.mostCommonIntention && stats.mostCommonIntention in UNLOCK_COPY.intentions
      ? UNLOCK_COPY.intentions[stats.mostCommonIntention as IntentionCode].label
      : stats.mostCommonIntention;
  const average = formatUnlockedDuration(stats.averageDurationMs);
  const todayTime = formatUnlockedDuration(stats.todayDurationMs);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title}>Unlocks</Text>
      <View style={styles.grid}>
        <Stat label="Today" value={String(stats.todayCount)} />
        <Stat label="All" value={String(stats.totalCount)} />
        <Stat label="Avg unlocked" value={average ?? '—'} />
        <Stat label="Unlocked today" value={todayTime ?? '—'} />
      </View>
      {mostOften ? (
        <Text style={styles.often}>
          {UNLOCK_COPY.mostOften(mostOften)}
          {stats.mostCommonCount > 1 ? ` · ${stats.mostCommonCount} times` : ''}
        </Text>
      ) : (
        <Text style={styles.often}>Most often will appear after a few choices</Text>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  stat: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: spacing.m,
  },
  statValue: {
    color: '#C7E5CD',
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  often: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
  },
});
