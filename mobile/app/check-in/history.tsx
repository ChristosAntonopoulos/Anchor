import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { ChoiceChips } from '../../components/checkIn/ChoiceChips';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { confirmedFeelings, entryPreview, entryTitle, formatFeeling, historyKind, isDraft } from '../../utils/checkIn';

const FILTERS = [
  { code: 'all', label: 'All' },
  { code: 'checkin', label: 'Check-ins' },
  { code: 'thought', label: 'Thoughts' },
  { code: 'problem', label: 'Problems' },
  { code: 'draft', label: 'Drafts' },
];

export default function HistoryScreen() {
  const router = useRouter();
  const entries = useCheckInStore((state) => state.entries);
  const loadHistory = useCheckInStore((state) => state.loadHistory);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      void loadHistory(filter === 'all' ? undefined : filter);
    }, [loadHistory, filter])
  );

  return (
    <CheckInChrome>
      <Text style={styles.title}>{CHECK_IN_COPY.history}</Text>
      <ChoiceChips
        accessibilityLabel="Filter history"
        options={FILTERS}
        selected={[filter]}
        onToggle={(code) => setFilter(code)}
      />
      {entries.length === 0 ? <Text style={styles.meta}>{CHECK_IN_COPY.emptyHistory}</Text> : null}
      {entries.map((entry) => {
        const feelings = confirmedFeelings(entry);
        const kind = historyKind(entry);
        return (
          <Pressable
            key={entry.id}
            onPress={() => router.push(`/check-in/${entry.id}`)}
            accessibilityRole="button"
            accessibilityLabel={entryTitle(entry)}
            style={styles.card}
          >
            <View style={styles.row}>
              <Text style={styles.date}>{new Date(entry.occurredAtUtc ?? entry.createdAt).toLocaleString()}</Text>
              <Text style={styles.badge}>
                {isDraft(entry) ? CHECK_IN_COPY.draft : kind === 'legacy' ? CHECK_IN_COPY.legacy : CHECK_IN_COPY.finished}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{entryTitle(entry)}</Text>
            <Text style={styles.preview} numberOfLines={2}>
              {entryPreview(entry)}
            </Text>
            {feelings.length > 0 ? (
              <Text style={styles.meta}>{feelings.map(formatFeeling).join(' · ')}</Text>
            ) : null}
            {entry.thoughtState || entry.problemSolving ? (
              <Text style={styles.meta}>
                {entry.problemSolving ? 'Linked problem-solving' : 'Linked thought exploration'}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      <CrisisCard />
    </CheckInChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
  },
  card: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.m,
    gap: spacing.s,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.s,
  },
  date: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    flex: 1,
  },
  badge: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  preview: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
});
