import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { HabitToggle } from './HabitToggle';
import { HabitCounter } from './HabitCounter';
import type { DisciplineBlock, DisciplineItem } from '../../types';

interface DisciplineBlockCardProps {
  block: DisciplineBlock;
  onToggleItem: (itemId: string, value: boolean) => void;
  onIncrementItem: (itemId: string) => void;
  onDecrementItem: (itemId: string) => void;
}

export function DisciplineBlockCard({ 
  block, 
  onToggleItem, 
  onIncrementItem, 
  onDecrementItem 
}: DisciplineBlockCardProps) {
  // Calculate progress for toggles
  const toggleItems = block.items.filter(item => item.type === 'toggle');
  const completedToggles = toggleItems.filter(item => item.toggleValue === true).length;
  const totalToggles = toggleItems.length;

  // Calculate total for counters
  const counterItems = block.items.filter(item => item.type === 'counter');
  const totalCount = counterItems.reduce((sum, item) => sum + (item.counterValue || 0), 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.blockName}>{block.blockName}</Text>
          {toggleItems.length > 0 && (
            <Text style={styles.progress}>
              {completedToggles}/{totalToggles}
            </Text>
          )}
          {counterItems.length > 0 && totalCount > 0 && (
            <Text style={styles.progress}>
              {totalCount}
            </Text>
          )}
        </View>
        
        <View style={styles.itemsContainer}>
          {block.items.map((item) => {
            if (item.type === 'toggle') {
              return (
                <HabitToggle
                  key={item.itemId}
                  label={item.itemName}
                  completed={item.toggleValue ?? false}
                  onToggle={() => onToggleItem(item.itemId, !(item.toggleValue ?? false))}
                />
              );
            } else {
              return (
                <HabitCounter
                  key={item.itemId}
                  label={item.itemName}
                  count={item.counterValue ?? 0}
                  onIncrement={() => onIncrementItem(item.itemId)}
                  onDecrement={() => onDecrementItem(item.itemId)}
                />
              );
            }
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  blockName: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  progress: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  itemsContainer: {
    gap: spacing.s,
  },
});
