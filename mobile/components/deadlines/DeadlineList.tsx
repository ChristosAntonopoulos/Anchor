import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { DeadlineCard } from './DeadlineCard';
import type { Deadline } from '../../types';

interface DeadlineListProps {
  deadlines: Deadline[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onAdd: () => void;
  onEdit: (deadline: Deadline) => void;
  onDelete: (deadline: Deadline) => void;
}

export function DeadlineList({
  deadlines,
  refreshing,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
}: DeadlineListProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {deadlines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="hourglass-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No commitments tracked. Add the next one that actually matters.</Text>
        </View>
      ) : (
        deadlines.map((deadline) => (
          <DeadlineCard
            key={deadline.id}
            deadline={deadline}
            onPress={() => onEdit(deadline)}
            onDelete={() => onDelete(deadline)}
          />
        ))
      )}
      <TouchableOpacity style={styles.add} onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add deadline">
        <Text style={styles.addText}>+ Add deadline</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.s,
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
  add: {
    marginHorizontal: spacing.l,
    marginTop: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  addText: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.body,
  },
});
