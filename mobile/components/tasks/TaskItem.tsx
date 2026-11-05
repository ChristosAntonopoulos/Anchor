import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { Task } from '../../types';

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return colors.warning;
    default:
      return colors.textMuted;
  }
}

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onPress?: () => void;
  onStart?: () => void;
}

export function TaskItem({ task, onToggle, onPress, onStart }: TaskItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
        colors={[colors.surface, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <TouchableOpacity
          onPress={onToggle}
          style={styles.checkboxContainer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
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
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {task.category}
              </Text>
            </View>
            {task.location && (
              <View style={styles.locationBadge}>
                <AppIcon name="location" size={12} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {task.location.placeName || 'Location'}
                </Text>
              </View>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <View style={styles.subtaskBadge}>
                <AppIcon name="list" size={12} color={colors.textSecondary} />
                <Text style={styles.subtaskText}>
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </Text>
              </View>
            )}
            {task.dueDate && (
              <View style={styles.dueDateBadge}>
                <AppIcon name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.dueDateText}>
                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
          {task.nextAction?.text || task.returnPoint ? (
            <Text style={styles.nextAction} numberOfLines={2}>
              {task.returnPoint ?? task.nextAction?.text}
            </Text>
          ) : null}
          {onStart && !task.completed ? (
            <TouchableOpacity style={styles.startBtn} onPress={onStart}>
              <Text style={styles.startBtnText}>Start</Text>
            </TouchableOpacity>
          ) : null}
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
  completed: {},
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
    borderColor: colors.borderControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  nextAction: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
  },
  startBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.s,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderRadius: 14,
  },
  startBtnText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
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
    backgroundColor: colors.surfaceRaised,
  },
  categoryText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
    color: colors.textMuted,
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
