import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { DeadlineWarning } from '../../types';

interface DeadlineWarningBannerProps {
  warning: DeadlineWarning;
}

export function DeadlineWarningBanner({ warning }: DeadlineWarningBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.marker} />
        <View style={styles.content}>
          <Text style={styles.label}>Needs a decision</Text>
          <Text style={styles.title}>{warning.title}</Text>
          <Text style={styles.message}>
            {warning.daysLeft} day{warning.daysLeft !== 1 ? 's' : ''} left · {warning.status}
          </Text>
        </View>
      </View>
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
    backgroundColor: colors.warningContainer,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    paddingLeft: spacing.m + 6,
    borderWidth: 1,
    borderColor: colors.warning,
    overflow: 'hidden',
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.warning,
  },
  content: {
    zIndex: 2,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
