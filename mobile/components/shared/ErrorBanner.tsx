import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.copy}>
        <Text style={styles.label}>Could not save</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton} accessibilityLabel="Dismiss">
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerContainer,
    padding: spacing.m,
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.danger,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.s,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.danger,
  },
  message: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  dismissText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
