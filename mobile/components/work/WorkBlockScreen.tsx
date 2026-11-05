import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../icons/AppIcon';
import { WorkSessionModal } from '../execution/WorkSessionModal';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../../constants/designTokens';
import { WORK_COPY } from '../../constants/work';
import { blockKindLabel, currentWorkStep, resolveWorkBlock } from '../../utils/workBlock';
import { useTodayStore } from '../../store/useTodayStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useExecutionStore } from '../../store/useExecutionStore';
import type { SessionLaunch } from '../../types/execution';

interface WorkBlockScreenProps {
  blockId?: string;
}

export function WorkBlockScreen({ blockId }: WorkBlockScreenProps) {
  const router = useRouter();
  const currentBlock = useTodayStore((state) => state.data?.currentBlock);
  const todayLoading = useTodayStore((state) => state.loading);
  const fetchToday = useTodayStore((state) => state.fetchToday);
  const { blocks, loading: scheduleLoading, fetchSchedule, completeChecklistItem } = useScheduleStore();
  const {
    session,
    profile,
    stuck,
    fetchNow,
    fetchProfile,
    askStuck,
    useStuck,
    clearStuck,
    skipRoutine,
    setRoutineVersion,
  } = useExecutionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<SessionLaunch | null>(null);

  useEffect(() => {
    void Promise.all([fetchToday(), fetchSchedule(), fetchProfile(), fetchNow()]);
  }, [fetchToday, fetchSchedule, fetchProfile, fetchNow]);

  const block = useMemo(
    () => resolveWorkBlock(blockId, currentBlock, blocks),
    [blockId, currentBlock, blocks],
  );
  const items = block?.checklistItems ?? [];
  const currentStep = currentWorkStep(block);
  const completedCount = items.filter((item) => item.completed).length;
  const allDone = items.length > 0 && completedCount === items.length;
  const shownItems = sequenceOpen ? items : currentStep ? [currentStep] : items.slice(0, 1);
  const activeForBlock = Boolean(session && session.status !== 'finished');
  const kind = block ? blockKindLabel(block) : null;

  const reload = async () => {
    setRefreshing(true);
    await Promise.all([fetchToday(), fetchSchedule(), fetchNow()]);
    setRefreshing(false);
  };

  const startBlock = () => {
    if (!block) {
      return;
    }
    if (activeForBlock) {
      setPendingStart(null);
      setSessionOpen(true);
      return;
    }
    setPendingStart({
      taskId: block.taskId ?? undefined,
      blockId: block.id,
      title: block.taskTitle ?? block.title,
      currentAction: currentStep?.title ?? block.entryAction ?? block.taskTitle ?? block.title,
      minutes: block.startMinutes ?? profile?.lastExplicitDurationMinutes ?? 5,
    });
    setSessionOpen(true);
  };

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.fill}
    >
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.headerButton}
          >
            <Text style={styles.headerLink}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{WORK_COPY.title}</Text>
          <View style={styles.headerButton} />
        </View>

        {!block && (todayLoading || scheduleLoading) ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !block ? (
          <View style={styles.empty}>
            {refreshing ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={styles.emptyTitle}>{WORK_COPY.missingTitle}</Text>
            <Text style={styles.emptyBody}>{WORK_COPY.missingBody}</Text>
            <TouchableOpacity
              style={styles.primary}
              onPress={() => router.push('/(tabs)/schedule')}
              accessibilityRole="button"
              accessibilityLabel={WORK_COPY.openSchedule}
            >
              <Text style={styles.primaryText}>{WORK_COPY.openSchedule}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Text style={styles.now}>{WORK_COPY.now}</Text>
              <Text style={styles.title}>{block.title}</Text>
              <Text style={styles.time}>
                {block.startTime} – {block.endTime}
              </Text>
              <Text style={styles.kind}>{kind}</Text>
              <Text style={styles.intro}>{WORK_COPY.intro}</Text>

              {block.taskTitle || block.entryAction ? (
                <Text style={styles.meta}>
                  {WORK_COPY.linkedTask}
                  {block.taskTitle ? ` · ${block.taskTitle}` : ''}
                  {block.entryAction ? `. ${block.entryAction}` : ''}
                </Text>
              ) : null}
              {block.manualCue ? (
                <Text style={styles.meta}>
                  {WORK_COPY.cue} · {block.manualCue}
                </Text>
              ) : null}

              {block.skipped ? <Text style={styles.skipped}>{WORK_COPY.skipped}</Text> : null}
              {allDone && !block.skipped ? <Text style={styles.done}>{WORK_COPY.done}</Text> : null}

              {currentStep && !block.skipped ? (
                <View style={styles.stepCard}>
                  <Text style={styles.stepLabel}>{WORK_COPY.currentStep}</Text>
                  <Text style={styles.stepTitle}>{currentStep.title}</Text>
                  {currentStep.durationMinutes ? (
                    <Text style={styles.stepMeta}>{currentStep.durationMinutes} min</Text>
                  ) : null}
                </View>
              ) : null}

              {items.length > 0 ? (
                <View style={styles.sequence}>
                  <Text style={styles.stepLabel}>{WORK_COPY.sequence}</Text>
                  {shownItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemRow}
                      onPress={() => {
                        if (!item.completed) {
                          void completeChecklistItem(block.id, item.id).then(() => reload());
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.completed ? `${item.title}. Done` : `${item.title}. ${WORK_COPY.markDone}`
                      }
                      disabled={item.completed}
                    >
                      <AppIcon
                        name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={item.completed ? colors.success : colors.textSecondary}
                      />
                      <Text style={[styles.itemText, item.completed && styles.itemDone]}>
                        {item.completed ? 'Done · ' : item.id === currentStep?.id ? 'Current step · ' : ''}
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {items.length > 1 ? (
                    <TouchableOpacity onPress={() => setSequenceOpen((open) => !open)}>
                      <Text style={styles.link}>
                        {sequenceOpen ? WORK_COPY.hideSequence : WORK_COPY.showSequence(items.length)}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text style={styles.progress}>{WORK_COPY.progress(completedCount, items.length)}</Text>
                </View>
              ) : block.routineActivities && block.routineActivities.length > 0 ? (
                <View style={styles.sequence}>
                  <Text style={styles.stepLabel}>{WORK_COPY.sequence}</Text>
                  {block.routineActivities.map((activity) => (
                    <Text key={activity} style={styles.itemText}>
                      ○  {activity}
                    </Text>
                  ))}
                </View>
              ) : null}

              {stuck ? (
                <View style={styles.stuckCard}>
                  <Text style={styles.stuckTitle}>{stuck.suggestedAction}</Text>
                  {stuck.explanation ? <Text style={styles.stuckBody}>{stuck.explanation}</Text> : null}
                  <TouchableOpacity
                    onPress={() => {
                      void useStuck(stuck.suggestedAction, block.taskId ?? undefined).then(() => {
                        setPendingStart({
                          taskId: block.taskId ?? undefined,
                          blockId: block.id,
                          title: block.taskTitle ?? block.title,
                          currentAction: stuck.suggestedAction,
                          minutes: 5,
                        });
                        setSessionOpen(true);
                      });
                    }}
                  >
                    <Text style={styles.link}>{WORK_COPY.useSmaller}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => clearStuck()}>
                    <Text style={styles.link}>{WORK_COPY.leaveSmaller}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {block.isRoutine && !block.skipped ? (
                <View style={styles.routineRow}>
                  <TouchableOpacity
                    style={[styles.routineChip, block.routineVersion !== 'shorter' && styles.routineChipOn]}
                    onPress={() => void setRoutineVersion(block.id, 'regular').then(() => reload())}
                  >
                    <Text style={styles.routineChipText}>Regular</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.routineChip, block.routineVersion === 'shorter' && styles.routineChipOn]}
                    onPress={() => void setRoutineVersion(block.id, 'shorter').then(() => reload())}
                  >
                    <Text style={styles.routineChipText}>Shorter</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!block.skipped && !allDone ? (
                <TouchableOpacity
                  style={styles.primary}
                  onPress={startBlock}
                  accessibilityRole="button"
                  accessibilityLabel={activeForBlock ? WORK_COPY.continue : WORK_COPY.start(block.startMinutes)}
                >
                  <Text style={styles.primaryText}>
                    {activeForBlock ? WORK_COPY.continue : WORK_COPY.start(block.startMinutes)}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {!block.skipped && !allDone ? (
                <TouchableOpacity
                  style={styles.secondary}
                  onPress={() => void askStuck({ taskId: block.taskId ?? undefined, makeSmaller: true })}
                  accessibilityRole="button"
                  accessibilityLabel={WORK_COPY.makeSmaller}
                >
                  <Text style={styles.secondaryText}>{WORK_COPY.makeSmaller}</Text>
                </TouchableOpacity>
              ) : null}

              {block.isRoutine && !block.skipped ? (
                <TouchableOpacity
                  style={styles.ghost}
                  onPress={() =>
                    void skipRoutine(block.id).then(() => {
                      void reload();
                      router.push('/(tabs)/schedule');
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={WORK_COPY.skipRoutine}
                >
                  <Text style={styles.ghostText}>{WORK_COPY.skipRoutine}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.ghost}
                onPress={() => router.push('/(tabs)/schedule')}
                accessibilityRole="button"
                accessibilityLabel={WORK_COPY.openSchedule}
              >
                <Text style={styles.ghostText}>{WORK_COPY.openSchedule}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        <WorkSessionModal
          visible={sessionOpen}
          pendingStart={pendingStart}
          onClose={() => {
            setSessionOpen(false);
            setPendingStart(null);
            void reload();
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  headerButton: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerLink: {
    color: colors.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  scroll: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    ...shadows.small,
  },
  now: {
    color: colors.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
  time: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
  },
  kind: {
    color: colors.textMuted,
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.m,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
  },
  skipped: {
    color: colors.warning,
    marginTop: spacing.s,
    fontSize: typography.fontSize.body,
  },
  done: {
    color: colors.success,
    marginTop: spacing.s,
    fontSize: typography.fontSize.body,
  },
  stepCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    marginTop: spacing.m,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  stepMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: 4,
  },
  sequence: {
    marginTop: spacing.m,
    gap: spacing.s,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: 44,
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    flex: 1,
  },
  itemDone: {
    color: colors.textSecondary,
  },
  progress: {
    color: colors.textMuted,
    fontSize: typography.fontSize.caption,
  },
  stuckCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    marginTop: spacing.m,
  },
  stuckTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  stuckBody: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
  },
  routineRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.m,
  },
  routineChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  routineChipOn: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  routineChipText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.caption,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.m,
  },
  primaryText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.medium,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.s,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
  },
  ghost: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  ghostText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
});
