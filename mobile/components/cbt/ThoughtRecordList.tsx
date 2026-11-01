import { View, Text, StyleSheet } from 'react-native';
import { ThoughtRecordCard } from './ThoughtRecordCard';
import { colors, spacing, typography } from '../../constants/designTokens';
import type { CBTEntry } from '../../types';

interface ThoughtRecordListProps {
  entries: CBTEntry[];
}

export function ThoughtRecordList({ entries }: ThoughtRecordListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No thought records yet. Write about your thoughts, feelings, or situation to get started.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => (
        <ThoughtRecordCard key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.l,
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
    lineHeight: 22,
  },
});
