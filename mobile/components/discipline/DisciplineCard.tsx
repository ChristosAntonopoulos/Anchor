import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';
import { AppIcon } from '../icons/AppIcon';
import { DisciplineBlockCard } from './DisciplineBlockCard';
import type { DisciplineEntry } from '../../types';

interface DisciplineCardProps {
  discipline: DisciplineEntry;
  onToggleItem: (blockId: string, itemId: string, value: boolean) => void;
  onIncrementItem: (blockId: string, itemId: string) => void;
  onDecrementItem: (blockId: string, itemId: string) => void;
  weeklyInsight?: string;
}

export function DisciplineCard({ 
  discipline, 
  onToggleItem, 
  onIncrementItem, 
  onDecrementItem,
  weeklyInsight 
}: DisciplineCardProps) {
  // Calculate overall progress
  let totalToggles = 0;
  let completedToggles = 0;
  let totalCount = 0;

  discipline.blocks.forEach(block => {
    block.items.forEach(item => {
      if (item.type === 'toggle') {
        totalToggles++;
        if (item.toggleValue === true) {
          completedToggles++;
        }
      } else if (item.type === 'counter') {
        totalCount += item.counterValue ?? 0;
      }
    });
  });

  // Sort blocks by order
  const sortedBlocks = [...discipline.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppIcon name="habits" size={22} />
          <Text style={styles.title}>Discipline</Text>
        </View>
        {totalToggles > 0 && (
          <Text style={styles.count}>
            {completedToggles}/{totalToggles}
          </Text>
        )}
      </View>
      {weeklyInsight && (
        <View style={styles.insightContainer}>
          <View style={styles.insightIcon}>
            <AppIcon name="insights" size={18} />
          </View>
          <Text style={styles.insightText}>{weeklyInsight}</Text>
        </View>
      )}
      {sortedBlocks.map((block) => (
        <DisciplineBlockCard
          key={block.blockId}
          block={block}
          onToggleItem={(itemId, value) => onToggleItem(block.blockId, itemId, value)}
          onIncrementItem={(itemId) => onIncrementItem(block.blockId, itemId)}
          onDecrementItem={(itemId) => onDecrementItem(block.blockId, itemId)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.l,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    marginHorizontal: spacing.l,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.category.health + '40',
  },
  insightIcon: {
    marginRight: spacing.s,
  },
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
});
