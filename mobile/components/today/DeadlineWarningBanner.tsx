import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { DeadlineWarning } from '../../types';

interface DeadlineWarningBannerProps {
  warning: DeadlineWarning;
}

export function DeadlineWarningBanner({ warning }: DeadlineWarningBannerProps) {
  const isBehind = warning.status === 'behind';
  const gradientColors = isBehind 
    ? ['#FF6B6B20', '#FF6B6B10'] 
    : ['#FFB84D20', '#FFB84D10'];
  const textColor = isBehind ? '#FF6B6B' : '#FFB84D';
  const borderColor = isBehind ? '#FF6B6B40' : '#FFB84D40';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { borderColor }]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>
            {warning.title}
          </Text>
          <Text style={[styles.message, { color: textColor }]}>
            {warning.daysLeft} day{warning.daysLeft !== 1 ? 's' : ''} left • {warning.status}
          </Text>
        </View>
        <View style={[styles.glowBar, { backgroundColor: textColor }]} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  banner: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    zIndex: 2,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.caption,
  },
  glowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.6,
  },
});
