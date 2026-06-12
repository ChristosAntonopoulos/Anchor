import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, typography } from '../../constants/designTokens';
import { useTaskStore, canAddToTodayFocus } from '../../store/useTaskStore';
import { TaskList } from '../../components/tasks/TaskList';
import { InboxTaskItem } from '../../components/tasks/InboxTaskItem';
import { AddTaskButton } from '../../components/tasks/AddTaskButton';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { MAX_TODAY_FOCUS } from '../../types';
import type { Task } from '../../types';

export default function TasksScreen() {
  const {
    todayFocus,
    inboxItems,
    inboxTotalCount,
    loading,
    error,
    fetchTasks,
    createTask,
    completeTask,
    updateTask,
    promoteTask,
    demoteTask,
  } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const canAddFocus = canAddToTodayFocus(todayFocus.length);
  const focusFull = todayFocus.length >= MAX_TODAY_FOCUS;

  const handlePromote = async (taskId: string) => {
    if (focusFull) {
      Alert.alert(
        'Focus list full',
        `You can only have ${MAX_TODAY_FOCUS} tasks in today's focus. Move one back to inbox first.`
      );
      return;
    }
    try {
      await promoteTask(taskId);
    } catch {
      // error surfaced via store
    }
  };

  if (loading && todayFocus.length === 0 && inboxItems.length === 0) {
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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's focus</Text>
            <Text style={styles.sectionMeta}>
              {todayFocus.length}/{MAX_TODAY_FOCUS}
            </Text>
          </View>
          <Text style={styles.sectionHint}>Pick up to {MAX_TODAY_FOCUS} tasks to execute today.</Text>

          <TaskList
            tasks={todayFocus}
            onToggleTask={completeTask}
            onTaskPress={(task) => {
              setSelectedTask(task);
              setShowTaskModal(true);
            }}
            emptyMessage="No focus tasks yet. Promote from inbox or add one below."
          />
          <AddTaskButton
            label="+ Add to today"
            limitMessage={`Today's focus is full (${MAX_TODAY_FOCUS} tasks). Move one to inbox first.`}
            onAddTask={(title, category) => createTask(title, category, 'today')}
            disabled={!canAddFocus}
          />

          <View style={[styles.sectionHeader, styles.inboxHeader]}>
            <Text style={styles.sectionTitle}>Inbox</Text>
            <Text style={styles.sectionMeta}>{inboxTotalCount}</Text>
          </View>
          <Text style={styles.sectionHint}>Capture everything here. Promote when you're ready to work on it.</Text>

          <View style={styles.inboxList}>
            {inboxItems.length === 0 ? (
              <Text style={styles.inboxEmpty}>Inbox is empty — great for a clear mind.</Text>
            ) : (
              inboxItems.map((task) => (
                <InboxTaskItem
                  key={task.id}
                  task={task}
                  promoteDisabled={focusFull}
                  onPromote={() => handlePromote(task.id)}
                  onPress={() => {
                    setSelectedTask(task);
                    setShowTaskModal(true);
                  }}
                />
              ))
            )}
          </View>
          <AddTaskButton
            label="+ Add to inbox"
            onAddTask={(title, category) => createTask(title, category, 'inbox')}
          />
        </ScrollView>
        <TaskDetailModal
          task={selectedTask}
          visible={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={async (updates) => {
            if (selectedTask) {
              await updateTask(selectedTask.id, updates);
            }
          }}
          onDemote={
            selectedTask?.status === 'today'
              ? async () => {
                  await demoteTask(selectedTask!.id);
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }
              : undefined
          }
        />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    marginTop: spacing.l,
    marginBottom: spacing.xs,
  },
  inboxHeader: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionMeta: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionHint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.m,
  },
  inboxList: {
    paddingHorizontal: spacing.l,
  },
  inboxEmpty: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.l,
  },
  errorText: {
    color: colors.category.health,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    fontSize: typography.fontSize.caption,
  },
});
