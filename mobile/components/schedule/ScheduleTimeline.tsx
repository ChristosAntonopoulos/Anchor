import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/designTokens';
import { ScheduleBlockItem } from './ScheduleBlockItem';
import type { ScheduleBlock } from '../../types';

interface ScheduleTimelineProps {
  blocks: ScheduleBlock[];
  currentBlockId?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onUpdateBlock?: (id: string, updates: { title?: string; startTime?: string; endTime?: string }) => void;
}

export function ScheduleTimeline({ blocks, currentBlockId, refreshing, onRefresh, onUpdateBlock }: ScheduleTimelineProps) {
  if (blocks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No schedule blocks configured.</Text>
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
      {blocks.map((block) => (
        <ScheduleBlockItem
          key={block.id}
          block={block}
          isCurrent={block.id === currentBlockId}
          onUpdate={onUpdateBlock ? (updates) => onUpdateBlock(block.id, updates) : undefined}
        />
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
