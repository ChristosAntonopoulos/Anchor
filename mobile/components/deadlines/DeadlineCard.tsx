import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { Deadline } from '../../types';

interface DeadlineCardProps {
  deadline: Deadline;
  onPress: () => void;
  onDelete: () => void;
}

export function DeadlineCard({ deadline, onPress, onDelete }: DeadlineCardProps) {
  const dueDate = new Date(`${deadline.dueDate}T12:00:00`);
  const formattedDate = Number.isNaN(dueDate.getTime())
    ? deadline.dueDate
    : dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysLeft =
    deadline.daysLeft ??
    Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const behind = deadline.status === 'behind' || daysLeft <= 7;
  const done = deadline.status === 'completed';

  return (
    <TouchableOpacity
      style={[styles.container, behind && !done && styles.behind, done && styles.done]}
      onPress={onPress}
      onLongPress={() =>
        Alert.alert(deadline.title, 'Remove this deadline?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ])
      }
      accessibilityRole="button"
      accessibilityLabel={`${deadline.title}. ${formattedDate}. ${deadline.status}`}
    >
      <View style={styles.marker} />
      <View style={styles.content}>
        <Text style={styles.kicker}>{done ? 'Done' : behind ? 'Needs a look' : 'On track'}</Text>
        <Text style={styles.title}>{deadline.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.daysLeft}>
            {done
              ? 'Completed'
              : `${daysLeft} day${daysLeft === 1 ? '' : 's'} ${daysLeft < 0 ? 'overdue' : 'left'}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    marginHorizontal: spacing.l,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.small,
  },
  behind: {
    borderColor: colors.warning,
  },
  done: {
    opacity: 0.65,
  },
  marker: {
    width: 4,
    backgroundColor: colors.warning,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  kicker: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  daysLeft: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});
