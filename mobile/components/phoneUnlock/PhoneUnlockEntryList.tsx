import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';
import { PhoneUnlockEntryItem } from './PhoneUnlockEntryItem';
import type { PhoneUnlockEntry } from '../../types';

interface PhoneUnlockEntryListProps {
  entries: PhoneUnlockEntry[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function PhoneUnlockEntryList({ entries, refreshing, onRefresh }: PhoneUnlockEntryListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No unlock entries yet. Unlock your phone to start tracking your reasons.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.category.stability} />
        ) : undefined
      }
    >
      <View style={styles.listContainer}>
        {entries.map((entry) => (
          <PhoneUnlockEntryItem key={entry.id} entry={entry} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.body,
  },
});
