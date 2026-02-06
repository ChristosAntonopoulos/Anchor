import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { ScheduleBlock } from '../../types';

interface CurrentBlockIndicatorProps {
  block: ScheduleBlock;
}

export function CurrentBlockIndicator({ block }: CurrentBlockIndicatorProps) {
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
});
