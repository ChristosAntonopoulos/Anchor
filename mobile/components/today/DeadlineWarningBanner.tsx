import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { DeadlineWarning } from '../../types';

interface DeadlineWarningBannerProps {
  warning: DeadlineWarning;
}

export function DeadlineWarningBanner({ warning }: DeadlineWarningBannerProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/more/deadlines' as any)}
      accessibilityRole="button"
      accessibilityLabel={`${warning.title}. Open deadlines.`}
    >
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
    </TouchableOpacity>
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
    flexDirection: 'row',
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
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  message: {
    marginTop: 2,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
