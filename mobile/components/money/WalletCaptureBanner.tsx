import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { notificationListener } from '../../services/notificationListener';

interface WalletCaptureBannerProps {
  listenerOn: boolean;
}

export function WalletCaptureBanner({ listenerOn }: WalletCaptureBannerProps) {
  if (Platform.OS !== 'android' || listenerOn) {
    return (
      <View style={styles.connected}>
        <Text style={styles.connectedText}>Google Wallet receipts are captured from notifications.</Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Connect Google Wallet</Text>
      <Text style={styles.body}>
        Turn on notification access so tap-to-pay receipts show up in Money. No bank login — Wallet alerts only, for now.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void notificationListener.openSettings();
        }}
        accessibilityRole="button"
        accessibilityLabel="Open notification access settings"
      >
        <Text style={styles.buttonText}>Allow notification access</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.caption,
  },
  connected: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
  },
  connectedText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
  },
});
