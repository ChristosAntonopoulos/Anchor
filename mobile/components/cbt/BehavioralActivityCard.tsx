import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { BehavioralActivity } from '../../types';

interface BehavioralActivityCardProps {
  activity: BehavioralActivity;
  onPress?: () => void;
  onComplete?: () => void;
}

export function BehavioralActivityCard({ activity, onPress, onComplete }: BehavioralActivityCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <AppIcon
              name={activity.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={activity.isCompleted ? colors.category.leverage : colors.textSecondary}
            />
            <Text style={[styles.title, activity.isCompleted && styles.titleCompleted]}>
              {activity.title}
            </Text>
          </View>
        </View>

        {activity.description && (
          <Text style={styles.description} numberOfLines={2}>
            {activity.description}
          </Text>
        )}

        {activity.scheduledDate && (
          <View style={styles.dateRow}>
            <AppIcon name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {new Date(activity.scheduledDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {activity.isCompleted && activity.completedDate && (
          <View style={styles.completedRow}>
            <AppIcon name="checkmark-circle" size={16} color={colors.category.leverage} />
            <Text style={styles.completedText}>
              Completed {new Date(activity.completedDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Ratings */}
        {(activity.moodBefore !== undefined || activity.moodAfter !== undefined || 
          activity.pleasureRating !== undefined || activity.masteryRating !== undefined) && (
          <View style={styles.ratingsContainer}>
            {activity.moodBefore !== undefined && (
              <View style={styles.rating}>
                <Text style={styles.ratingLabel}>Mood Before:</Text>
                <Text style={styles.ratingValue}>{activity.moodBefore}/10</Text>
              </View>
            )}
            {activity.moodAfter !== undefined && (
              <View style={styles.rating}>
                <Text style={styles.ratingLabel}>Mood After:</Text>
                <Text style={styles.ratingValue}>{activity.moodAfter}/10</Text>
              </View>
            )}
            {activity.pleasureRating !== undefined && (
              <View style={styles.rating}>
                <Text style={styles.ratingLabel}>Pleasure:</Text>
                <Text style={styles.ratingValue}>{activity.pleasureRating}/10</Text>
              </View>
            )}
            {activity.masteryRating !== undefined && (
              <View style={styles.rating}>
                <Text style={styles.ratingLabel}>Mastery:</Text>
                <Text style={styles.ratingValue}>{activity.masteryRating}/10</Text>
              </View>
            )}
          </View>
        )}

        {!activity.isCompleted && onComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={onComplete}
          >
            <LinearGradient
              colors={[colors.category.health, colors.category.health + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completeGradient}
            >
              <Text style={styles.completeText}>Mark Complete</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  completedText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.leverage,
  },
  ratingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginTop: spacing.s,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  ratingValue: {
    fontSize: typography.fontSize.caption,
    color: colors.category.health,
    fontWeight: typography.fontWeight.semibold,
  },
  completeButton: {
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  completeGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.s,
    alignItems: 'center',
  },
  completeText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
