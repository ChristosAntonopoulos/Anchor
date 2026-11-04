import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, type ComponentType } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
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
  onStartBlock?: () => void;
  onRoutineVersion?: (version: 'regular' | 'shorter') => void;
  onSkipRoutine?: () => void;
}

export function ScheduleBlockItem({ block, isCurrent, onUpdate, onItemComplete, onStartBlock, onRoutineVersion, onSkipRoutine }: ScheduleBlockItemProps) {
  const [editVisible, setEditVisible] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);
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
              <AppIcon name="create-outline" size={18} color={colors.textSecondary} style={styles.editIcon} />
            )}
          </View>

          {items.length > 0 && (
            <View style={styles.checklistContainer}>
              {(() => {
                const currentItem = items.find((item) => !item.completed);
                const shown = sequenceOpen ? items : currentItem ? [currentItem] : items.slice(0, 1);
                return shown.map((item) => (
                  <View key={item.id} style={styles.checklistRow}>
                    <AppIcon
                      name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={item === currentItem ? 16 : 14}
                      color={item.completed ? colors.category.work : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.checklistText,
                        item.completed && styles.checklistTextDone,
                        isCurrent && styles.currentChecklistText,
                        item === currentItem && styles.currentAction,
                      ]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.durationBadge}>{item.durationMinutes ?? '—'}m</Text>
                  </View>
                ));
              })()}
              {items.length > 1 ? (
                <TouchableOpacity onPress={() => setSequenceOpen((value) => !value)}>
                  <Text style={styles.moreItems}>{sequenceOpen ? 'Hide sequence' : `Show sequence (${items.length})`}</Text>
                </TouchableOpacity>
              ) : null}
              <Text style={styles.checklistProgress}>
                {completedCount}/{items.length} done
              </Text>
            </View>
          )}

          {block.taskTitle || block.entryAction ? (
            <Text style={styles.taskLine} numberOfLines={2}>
              {block.taskTitle ? `${block.taskTitle}. ` : ''}{block.entryAction ?? ''}
            </Text>
          ) : null}
          {block.manualCue ? (
            <Text style={styles.taskLine}>Cue: {block.manualCue}</Text>
          ) : null}

          {block.skipped ? (
            <Text style={styles.skipped}>Left for today</Text>
          ) : null}

          {block.isRoutine && !block.skipped ? (
            <View style={styles.routineRow}>
              {onRoutineVersion ? (
                <>
                  <TouchableOpacity style={[styles.routineChip, block.routineVersion !== 'shorter' && styles.routineChipOn]} onPress={() => onRoutineVersion('regular')}>
                    <Text style={styles.routineChipText}>Regular</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.routineChip, block.routineVersion === 'shorter' && styles.routineChipOn]} onPress={() => onRoutineVersion('shorter')}>
                    <Text style={styles.routineChipText}>Shorter</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {onSkipRoutine ? (
                <TouchableOpacity style={styles.routineChip} onPress={onSkipRoutine}>
                  <Text style={styles.routineChipText}>Skip</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {onStartBlock && !allDone && !block.skipped ? (
            <TouchableOpacity
              style={[styles.startButton, isCurrent && styles.startButtonCurrent]}
              onPress={(e) => {
                e.stopPropagation?.();
                onStartBlock();
              }}
              activeOpacity={0.85}
            >
              <AppIcon name="play-circle" size={20} color={colors.background} />
              <Text style={styles.startButtonText}>
                Start {block.startMinutes ? `${block.startMinutes} min` : ''}
              </Text>
            </TouchableOpacity>
          ) : items.length > 0 && !allDone && onItemComplete ? (
            <TouchableOpacity
              style={[styles.startButton, isCurrent && styles.startButtonCurrent]}
              onPress={(e) => {
                e.stopPropagation?.();
                void openTimer();
              }}
              activeOpacity={0.85}
            >
              <AppIcon name="play-circle" size={20} color={colors.background} />
              <Text style={styles.startButtonText}>
                {isCurrent ? 'Start block timer' : 'Start block'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {allDone && (
            <View style={styles.doneBadge}>
              <AppIcon name="checkmark-done" size={16} color={colors.category.work} />
              <Text style={styles.doneBadgeText}>
                {block.routineVersion === 'shorter' ? 'Shorter routine complete.' : 'Completed today'}
              </Text>
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
  currentAction: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  skipped: {
    color: colors.textSecondary,
    marginTop: spacing.s,
    fontSize: typography.fontSize.caption,
  },
  routineChipOn: {
    backgroundColor: '#31443C',
    borderColor: colors.category.leverage,
  },
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
  taskLine: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
  },
  routineRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  routineChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
  },
  routineChipText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.caption,
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
