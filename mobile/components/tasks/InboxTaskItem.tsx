import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Task } from '../../types';

interface InboxTaskItemProps {
  task: Task;
  onPromote: () => void;
  onPress?: () => void;
  promoteDisabled?: boolean;
}

export function InboxTaskItem({ task, onPromote, onPress, promoteDisabled }: InboxTaskItemProps) {
  const { getCategoryColor, getCategoryGlow } = useCategoryStore();
  const categoryColor = getCategoryColor(task.category);
  const glowColor = getCategoryGlow(task.category);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.main}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={[styles.categoryTag, { backgroundColor: glowColor }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {task.category}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onPromote}
        disabled={promoteDisabled}
        style={[styles.promoteButton, promoteDisabled && styles.promoteDisabled]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="arrow-up-circle-outline"
          size={28}
          color={promoteDisabled ? colors.textSecondary : colors.category.work}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  main: {
    flex: 1,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
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
  promoteButton: {
    padding: spacing.xs,
  },
  promoteDisabled: {
    opacity: 0.4,
  },
});
