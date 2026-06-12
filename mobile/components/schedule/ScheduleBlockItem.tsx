import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, type ComponentType } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { ScheduleBlock } from '../../types';
import { ScheduleBlockEditModal } from './ScheduleBlockEditModal';

type BlockTimerModalProps = {
  block: ScheduleBlock;
  visible: boolean;
  onClose: () => void;
  onItemComplete: (blockId: string, itemId: string) => Promise<void>;
};

interface ScheduleBlockItemProps {
  block: ScheduleBlock;
  isCurrent?: boolean;
  onUpdate?: (updates: { title?: string; startTime?: string; endTime?: string }) => void;
  onItemComplete?: (blockId: string, itemId: string) => Promise<void>;
}

export function ScheduleBlockItem({ block, isCurrent, onUpdate, onItemComplete }: ScheduleBlockItemProps) {
  const [editVisible, setEditVisible] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [TimerModal, setTimerModal] = useState<ComponentType<BlockTimerModalProps> | null>(null);

  const openTimer = async () => {
    if (!TimerModal) {
      const mod = await import('./BlockTimerModal');
      setTimerModal(() => mod.BlockTimerModal);
    }
    setTimerVisible(true);
  };

  const gradientColors = isCurrent
    ? ([colors.category.work + '30', colors.category.work + '10'] as const)
    : (['#1E2530', '#252B38'] as const);

  const canEdit = !isCurrent && onUpdate;
  const items = block.checklistItems ?? [];
  const completedCount = items.filter((i) => i.completed).length;
  const allDone = items.length > 0 && completedCount === items.length;

  const handleSave = (updates: { title?: string; startTime?: string; endTime?: string }) => {
    onUpdate?.(updates);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isCurrent && styles.currentContainer]}
        onLongPress={() => canEdit && setEditVisible(true)}
        activeOpacity={canEdit ? 0.7 : 1}
        disabled={!canEdit}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isCurrent && styles.currentGradient]}
        >
          <View style={styles.timeContainer}>
            <Text style={[styles.time, isCurrent && styles.currentTime]}>{block.startTime}</Text>
            <Text style={[styles.timeSeparator, isCurrent && styles.currentTime]}>-</Text>
            <Text style={[styles.time, isCurrent && styles.currentTime]}>{block.endTime}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isCurrent && styles.currentTitle]}>{block.title}</Text>
            {canEdit && (
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} style={styles.editIcon} />
            )}
          </View>

          {items.length > 0 && (
            <View style={styles.checklistContainer}>
              {items.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.checklistRow}>
                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={item.completed ? colors.category.work : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.checklistText,
                      item.completed && styles.checklistTextDone,
                      isCurrent && styles.currentChecklistText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.durationBadge}>{item.durationMinutes ?? '—'}m</Text>
                </View>
              ))}
              {items.length > 3 && (
                <Text style={styles.moreItems}>+{items.length - 3} more steps</Text>
              )}
              <Text style={styles.checklistProgress}>
                {completedCount}/{items.length} done
              </Text>
            </View>
          )}

          {items.length > 0 && !allDone && onItemComplete && (
            <TouchableOpacity
              style={[styles.startButton, isCurrent && styles.startButtonCurrent]}
              onPress={(e) => {
                e.stopPropagation?.();
                void openTimer();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="play-circle" size={20} color={colors.background} />
              <Text style={styles.startButtonText}>
                {isCurrent ? 'Start block timer' : 'Start block'}
              </Text>
            </TouchableOpacity>
          )}

          {allDone && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-done" size={16} color={colors.category.work} />
              <Text style={styles.doneBadgeText}>Completed today</Text>
            </View>
          )}

          {isCurrent && <View style={styles.glowIndicator} />}
        </LinearGradient>
      </TouchableOpacity>

      {canEdit && (
        <ScheduleBlockEditModal
          visible={editVisible}
          block={block}
          onClose={() => setEditVisible(false)}
          onSave={handleSave}
        />
      )}

      {timerVisible && TimerModal && onItemComplete && (
        <TimerModal
          block={block}
          visible={timerVisible}
          onClose={() => setTimerVisible(false)}
          onItemComplete={onItemComplete}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
    marginHorizontal: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  currentContainer: {
    ...shadows.glow.work,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  currentGradient: {
    borderColor: colors.category.work + '60',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  editIcon: { marginLeft: spacing.xs },
  time: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  currentTime: { color: colors.category.work },
  timeSeparator: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  currentTitle: { color: colors.category.work },
  glowIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.category.work,
    opacity: 0.8,
  },
  checklistContainer: {
    marginTop: spacing.s,
    gap: spacing.xs,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checklistText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  checklistTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  currentChecklistText: { color: colors.category.work + 'CC' },
  durationBadge: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  moreItems: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  checklistProgress: {
    fontSize: typography.fontSize.small,
    color: colors.category.work,
    marginTop: spacing.xs,
  },
  startButton: {
    marginTop: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.category.leverage,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  startButtonCurrent: {
    backgroundColor: colors.category.work,
  },
  startButtonText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  doneBadge: {
    marginTop: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  doneBadgeText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
  },
});
