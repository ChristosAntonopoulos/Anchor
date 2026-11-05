import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { Deadline } from '../../types';

interface DeadlineCardProps {
  deadline: Deadline;
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const gradientColors = [colors.warningContainer, colors.warningContainer] as const;
  const borderColor = colors.warning;
  const glowShadow = shadows.small;

  const formattedDate = new Date(deadline.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate days left if not provided
  const today = new Date();
  const dueDate = new Date(deadline.dueDate);
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View style={[styles.container, glowShadow]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderColor }]}
      >
        <View style={styles.content}>
          <Text style={styles.kicker}>Needs a decision</Text>
          <Text style={styles.title}>{deadline.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.daysLeft}>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {deadline.status}
            </Text>
          </View>
        </View>
        <View style={styles.glowBar} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    marginHorizontal: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    zIndex: 2,
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
    marginBottom: spacing.s,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    backgroundColor: colors.surfaceRaised,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
    color: colors.textPrimary,
  },
  glowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.warning,
  },
});
