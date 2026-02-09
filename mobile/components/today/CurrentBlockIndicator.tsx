import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { ScheduleBlock } from '../../types';

interface CurrentBlockIndicatorProps {
  block: ScheduleBlock | null | undefined;
}

export function CurrentBlockIndicator({ block }: CurrentBlockIndicatorProps) {
  // Show breathing quote when no current block
  if (!block || !block.title) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.frame}
        >
          <Text style={styles.label}>Current Block</Text>
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#252B38', '#2A3441']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.content}>
                <Ionicons name="leaf-outline" size={24} color={colors.category.health} style={styles.quoteIcon} />
                <Text style={styles.quoteText}>Take a deep breath. This moment is enough.</Text>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        <Text style={styles.label}>Current Block</Text>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#252B38', '#2A3441']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.content}>
              <Text style={styles.blockTitle}>{block.title}</Text>
              <Text style={styles.blockTime}>
                {block.startTime} - {block.endTime}
              </Text>
              {block.routineActivities && block.routineActivities.length > 0 && (
                <View style={styles.activitiesContainer}>
                  {block.routineActivities.map((activity, index) => (
                    <View key={index} style={styles.activityItem}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.activityText}>{activity}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.glowIndicator} />
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  frame: {
    borderRadius: borderRadius.large,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  label: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContainer: {
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  card: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    zIndex: 2,
  },
  blockTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  blockTime: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  glowIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.category.work,
    opacity: 0.6,
  },
  quoteIcon: {
    marginBottom: spacing.s,
    alignSelf: 'center',
  },
  quoteText: {
    fontSize: typography.fontSize.body,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  activitiesContainer: {
    marginTop: spacing.s,
    gap: spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
