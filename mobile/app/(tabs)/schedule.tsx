import { View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useTodayStore } from '../../store/useTodayStore';
import { ScheduleTimeline } from '../../components/schedule/ScheduleTimeline';

export default function ScheduleScreen() {
  const { blocks, loading, fetchSchedule, updateBlock } = useScheduleStore();
  const { data: todayData, fetchToday } = useTodayStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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
            <ActivityIndicator size="large" color={colors.category.work} />
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
