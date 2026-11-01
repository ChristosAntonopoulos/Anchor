import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { DisciplineEntry } from '../../types';

interface DisciplineQuickToggleProps {
  discipline: DisciplineEntry;
}

export function DisciplineQuickToggle({ discipline }: DisciplineQuickToggleProps) {
  const router = useRouter();

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

  const handlePress = () => {
    router.push('/(tabs)/discipline');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Discipline</Text>
          <View style={styles.headerRight}>
            {totalToggles > 0 && (
              <Text style={styles.count}>
                {completedToggles}/{totalToggles}
              </Text>
            )}
            <AppIcon name="chevron-forward" size={20} color={colors.textSecondary} style={styles.chevron} />
          </View>
        </View>
        
        <View style={styles.blocksContainer}>
          {sortedBlocks.slice(0, 2).map((block) => {
            const toggleItems = block.items.filter(item => item.type === 'toggle');
            const completedTogglesInBlock = toggleItems.filter(item => item.toggleValue === true).length;
            const totalTogglesInBlock = toggleItems.length;
            const counterItems = block.items.filter(item => item.type === 'counter');
            const totalCountInBlock = counterItems.reduce((sum, item) => sum + (item.counterValue || 0), 0);

            return (
              <View key={block.blockId} style={styles.blockRow}>
                <Text style={styles.blockName}>{block.blockName}</Text>
                {totalTogglesInBlock > 0 && (
                  <Text style={styles.blockProgress}>
                    {completedTogglesInBlock}/{totalTogglesInBlock}
                  </Text>
                )}
                {counterItems.length > 0 && totalCountInBlock > 0 && (
                  <Text style={styles.blockProgress}>
                    {totalCountInBlock}
                  </Text>
                )}
              </View>
            );
          })}
          {sortedBlocks.length > 2 && (
            <Text style={styles.moreText}>+{sortedBlocks.length - 2} more</Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  frame: {
    borderRadius: borderRadius.large,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  blocksContainer: {
    gap: spacing.xs,
  },
  blockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  blockName: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  blockProgress: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginLeft: spacing.s,
  },
  moreText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
