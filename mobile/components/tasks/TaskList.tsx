import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/designTokens';
import { TaskItem } from './TaskItem';
import type { Task } from '../../types';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export function TaskList({ tasks, onToggleTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>Add one task that makes today successful.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => onToggleTask(task.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
  },
  emptyContainer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.m,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
