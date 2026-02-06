import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useTodayStore } from '../../store/useTodayStore';
import { TaskList } from '../../components/tasks/TaskList';
import { AddTaskButton } from '../../components/tasks/AddTaskButton';

export default function TasksScreen() {
  const { data, loading, error, fetchToday, createTask, completeTask } = useTodayStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!data) {
      fetchToday();
    }
  }, [data, fetchToday]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchToday();
    setRefreshing(false);
  };

  const tasks = data?.tasks || [];
  const canAddTask = tasks.length < 5;

  if (loading && !data) {
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
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.work} />
          }
        >
          <TaskList tasks={tasks} onToggleTask={completeTask} />
          <AddTaskButton
            onAddTask={(title, category) => createTask(title, category)}
            disabled={!canAddTask}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
