import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';
import { DeadlineCard } from './DeadlineCard';
import type { Deadline } from '../../types';

interface DeadlineListProps {
  deadlines: Deadline[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function DeadlineList({ deadlines, refreshing, onRefresh }: DeadlineListProps) {
  if (deadlines.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No urgent commitments right now.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.category.work} />
        ) : undefined
      }
    >
      {deadlines.map((deadline) => (
        <DeadlineCard key={deadline.id} deadline={deadline} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.m,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
