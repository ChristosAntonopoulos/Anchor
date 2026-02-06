import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { Deadline } from '../../types';

interface DeadlineCardProps {
  deadline: Deadline;
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const isBehind = deadline.status === 'behind';
  const gradientColors = isBehind 
    ? ['#FF6B6B30', '#FF6B6B10'] 
    : ['#FFB84D30', '#FFB84D10'];
  const textColor = isBehind ? '#FF6B6B' : '#FFB84D';
  const borderColor = isBehind ? '#FF6B6B60' : '#FFB84D60';
  const glowShadow = isBehind ? shadows.glow.health : shadows.glow.health;

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
    <View style={[styles.container, isBehind && glowShadow]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderColor }]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>{deadline.title}</Text>
          <View style={styles.meta}>
            <Text style={[styles.date, { color: textColor }]}>{formattedDate}</Text>
            <Text style={[styles.daysLeft, { color: textColor }]}>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: textColor + '30' }]}>
            <Text style={[styles.statusText, { color: textColor }]}>
              {deadline.status}
            </Text>
          </View>
        </View>
        <View style={[styles.glowBar, { backgroundColor: textColor }]} />
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
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.s,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  date: {
    fontSize: typography.fontSize.caption,
  },
  daysLeft: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  glowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.8,
  },
});
