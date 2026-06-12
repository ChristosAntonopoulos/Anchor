import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, gradients } from '../../constants/designTokens';
import type { ScheduleBlock } from '../../types';
import { useBlockTimer } from '../../hooks/useBlockTimer';
import { formatCountdown } from '../../utils/formatCountdown';

interface BlockTimerModalProps {
  block: ScheduleBlock;
  visible: boolean;
  onClose: () => void;
  onItemComplete: (blockId: string, itemId: string) => Promise<void>;
}

export function BlockTimerModal({ block, visible, onClose, onItemComplete }: BlockTimerModalProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const items = block.checklistItems ?? [];

  const timer = useBlockTimer({
    items,
    onItemComplete: async (itemId) => onItemComplete(block.id, itemId),
  });

  useEffect(() => {
    if (!timer.running) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [timer.running, pulse]);

  const completedCount = timer.sorted.filter((i) => i.completed).length;
  const progressPercent = Math.round(timer.progress * 100);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.blockTitle}>{block.title}</Text>
              <Text style={styles.blockTime}>
                {block.startTime} – {block.endTime}
              </Text>
            </View>
            <Text style={styles.progressLabel}>
              {completedCount}/{timer.sorted.length}
            </Text>
          </View>

          {timer.finished ? (
            <View style={styles.finishedContainer}>
              <Ionicons name="checkmark-circle" size={72} color={colors.category.work} />
              <Text style={styles.finishedTitle}>Block complete</Text>
              <Text style={styles.finishedSubtitle}>Nice work — you finished every step.</Text>
              <TouchableOpacity style={styles.primaryBtnBlock} onPress={onClose}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : !timer.started ? (
            <View style={styles.finishedContainer}>
              <Ionicons name="timer-outline" size={64} color={colors.category.work} />
              <Text style={styles.finishedTitle}>Ready to start?</Text>
              <Text style={styles.finishedSubtitle}>
                {timer.sorted.length} steps · tap Start when you're ready
              </Text>
              <TouchableOpacity style={styles.primaryBtnBlock} onPress={timer.start}>
                <Text style={styles.primaryBtnText}>Start timer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.timerSection}>
                <Text style={styles.stepLabel}>NOW</Text>
                <Text style={styles.taskTitle}>{timer.activeItem?.title ?? '—'}</Text>

                <Animated.View style={[styles.countdownWrap, { transform: [{ scale: pulse }] }]}>
                  <Text style={styles.countdown}>{formatCountdown(timer.secondsLeft)}</Text>
                </Animated.View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>

                {timer.nextItem ? (
                  <Text style={styles.nextUp}>Next: {timer.nextItem.title}</Text>
                ) : (
                  <Text style={styles.nextUp}>Last step in this block</Text>
                )}
              </View>

              <View style={styles.controls}>
                {timer.running ? (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={timer.pause}>
                    <Ionicons name="pause" size={20} color={colors.textPrimary} />
                    <Text style={styles.secondaryBtnText}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={timer.resume}>
                    <Ionicons name="play" size={20} color={colors.textPrimary} />
                    <Text style={styles.secondaryBtnText}>Resume</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.secondaryBtn} onPress={timer.skip}>
                  <Ionicons name="play-skip-forward" size={20} color={colors.textPrimary} />
                  <Text style={styles.secondaryBtnText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtnBlock, styles.primaryBtnInline]} onPress={timer.completeEarly}>
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checklistPreview}>
                {timer.sorted.map((item, idx) => (
                  <View key={item.id} style={styles.checklistRow}>
                    <Ionicons
                      name={
                        item.completed
                          ? 'checkmark-circle'
                          : idx === timer.activeIndex
                            ? 'radio-button-on'
                            : 'ellipse-outline'
                      }
                      size={18}
                      color={
                        item.completed || idx === timer.activeIndex
                          ? colors.category.work
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.checklistText,
                        item.completed && styles.checklistTextDone,
                        idx === timer.activeIndex && styles.checklistTextActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.checklistDuration}>{item.durationMinutes}m</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  closeBtn: { padding: spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  blockTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  blockTime: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontWeight: typography.fontWeight.bold,
    minWidth: 36,
    textAlign: 'right',
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  stepLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    letterSpacing: 2,
    marginBottom: spacing.s,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  countdownWrap: { marginVertical: spacing.l },
  countdown: {
    fontSize: 72,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.work,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginTop: spacing.m,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.category.work,
    borderRadius: borderRadius.round,
  },
  nextUp: {
    marginTop: spacing.l,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
  },
  primaryBtnBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.category.work,
    minHeight: 48,
  },
  primaryBtnInline: {
    flex: 1,
    alignSelf: 'auto',
  },
  primaryBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  checklistPreview: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.xs,
  },
  checklistText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  checklistTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  checklistTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  checklistDuration: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
    gap: spacing.m,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  finishedTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  finishedSubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
