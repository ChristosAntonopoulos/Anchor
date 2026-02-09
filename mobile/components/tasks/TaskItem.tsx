import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Task } from '../../types';

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#EF4444';
    case 'high':
      return colors.category.health;
    case 'medium':
      return colors.category.work;
    case 'low':
      return colors.textSecondary;
    default:
      return colors.textSecondary;
  }
}

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onPress?: () => void;
}

export function TaskItem({ task, onToggle, onPress }: TaskItemProps) {
  const { getCategoryColor, getCategoryGlow } = useCategoryStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const categoryColor = getCategoryColor(task.category);
  const glowColor = getCategoryGlow(task.category);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        task.completed && styles.completed,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress || onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <TouchableOpacity
          onPress={onToggle}
          style={styles.checkboxContainer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.checkbox, task.completed && styles.checkboxChecked, task.completed && { backgroundColor: categoryColor }]}>
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, task.completed && styles.completedText]}>
              {task.title}
            </Text>
            {task.priority && (
              <View style={[styles.priorityBadge, { borderColor: getPriorityColor(task.priority) }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.categoryTag, { backgroundColor: glowColor }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {task.category}
              </Text>
            </View>
            {task.location && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={12} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {task.location.placeName || 'Location'}
                </Text>
              </View>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <View style={styles.subtaskBadge}>
                <Ionicons name="list" size={12} color={colors.textSecondary} />
                <Text style={styles.subtaskText}>
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </Text>
              </View>
            )}
            {task.dueDate && (
              <View style={styles.dueDateBadge}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.dueDateText}>
                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  completed: {
    opacity: 0.6,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxContainer: {
    marginRight: spacing.m,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    opacity: 0.3,
  },
  categoryText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.s,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
  },
  locationText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  subtaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
  },
  subtaskText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
  },
  dueDateText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
});
