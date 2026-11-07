import { View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useTodayStore } from '../../store/useTodayStore';
import { ScheduleTimeline } from '../../components/schedule/ScheduleTimeline';
import { WorkSessionModal } from '../../components/execution/WorkSessionModal';
import { useExecutionStore } from '../../store/useExecutionStore';
import type { SessionLaunch } from '../../types/execution';

export default function ScheduleScreen() {
  const { blocks, loading, fetchSchedule, updateBlock, completeChecklistItem } = useScheduleStore();
  const { data: todayData, fetchToday } = useTodayStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<SessionLaunch | null>(null);
  const profile = useExecutionStore((s) => s.profile);
  const fetchProfile = useExecutionStore((s) => s.fetchProfile);
  const setRoutineVersion = useExecutionStore((s) => s.setRoutineVersion);
  const skipRoutine = useExecutionStore((s) => s.skipRoutine);

  useEffect(() => {
    void Promise.all([fetchSchedule(), fetchToday(), fetchProfile()]);
  }, [fetchSchedule, fetchToday, fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSchedule(), fetchToday()]);
    setRefreshing(false);
  };

  const currentBlockId = todayData?.currentBlock.id;

  if (loading && blocks.length === 0) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScheduleTimeline
          blocks={blocks}
          currentBlockId={currentBlockId}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onUpdateBlock={updateBlock}
          onItemComplete={completeChecklistItem}
          onStartBlock={(block) => {
            setPendingStart({
              taskId: block.taskId ?? undefined,
              blockId: block.id,
              title: block.taskTitle ?? block.title,
              currentAction: block.entryAction ?? block.taskTitle ?? block.title,
              minutes: block.startMinutes ?? profile?.lastExplicitDurationMinutes ?? 5,
            });
            setSessionOpen(true);
          }}
          onRoutineVersion={(block, version) => void setRoutineVersion(block.id, version).then(() => fetchSchedule())}
          onSkipRoutine={(block) => void skipRoutine(block.id).then(() => fetchSchedule())}
        />
        <WorkSessionModal
          visible={sessionOpen}
          pendingStart={pendingStart}
          onClose={() => {
            setSessionOpen(false);
            setPendingStart(null);
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
