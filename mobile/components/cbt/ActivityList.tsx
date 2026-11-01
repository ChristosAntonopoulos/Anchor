import { View, Text, StyleSheet } from 'react-native';
import { BehavioralActivityCard } from './BehavioralActivityCard';
import { colors, spacing, typography } from '../../constants/designTokens';
import type { BehavioralActivity } from '../../types';

interface ActivityListProps {
  activities: BehavioralActivity[];
  onComplete?: (activity: BehavioralActivity) => void;
}

export function ActivityList({ activities, onComplete }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No activities scheduled yet. Add activities to track your behavioral activation.
        </Text>
      </View>
    );
  }

  const pendingActivities = activities.filter((a) => !a.isCompleted);
  const completedActivities = activities.filter((a) => a.isCompleted);

  return (
    <View style={styles.container}>
      {pendingActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled</Text>
          {pendingActivities.map((activity) => (
            <BehavioralActivityCard
              key={activity.id}
              activity={activity}
              onComplete={onComplete ? () => onComplete(activity) : undefined}
            />
          ))}
        </View>
      )}

      {completedActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed</Text>
          {completedActivities.map((activity) => (
            <BehavioralActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
  },
  section: {
    marginTop: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  emptyContainer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
