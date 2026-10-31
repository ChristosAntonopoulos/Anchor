import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { CreatePhoneUnlockEntryRequest } from '../../types';

interface PhoneUnlockReasonModalProps {
  visible: boolean;
  onSubmit: (request: CreatePhoneUnlockEntryRequest) => Promise<void>;
  unlockTime: number;
  onClose?: () => void;
}

const REASONS = [
  { label: 'No reason', icon: 'close' },
  { label: 'A task', icon: 'tasks' },
  { label: 'A message', icon: 'notification' },
] as const;

export function PhoneUnlockReasonModal({
  visible,
  onSubmit,
  unlockTime,
  onClose,
}: PhoneUnlockReasonModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (reason: string) => {
    if (loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (!unlockTime || Number.isNaN(unlockTime)) {
        throw new Error('Invalid unlock time');
      }

      await onSubmit({
        reason,
        unlockedAt: new Date(unlockTime).toISOString(),
      });

      setError(null);
      onClose?.();
    } catch (err: unknown) {
      const fallback = 'Failed to save. Please check your connection and try again.';
      const message =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : fallback;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => {
        if (!loading) {
          void handleSubmit('No reason');
        }
      }}
    >
      <LinearGradient
        colors={['#0F1419', '#1A1F2E', '#0F1419']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AppIcon name="focus" size={64} />
          </View>

          <Text style={styles.title}>Why did you unlock your phone?</Text>
          <Text style={styles.description}>
            Pick one. This is how the app tracks what pulled you back to the screen.
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <AppIcon name="close" size={20} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {REASONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.reasonButton, loading && styles.reasonButtonDisabled]}
              onPress={() => void handleSubmit(item.label)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <AppIcon name={item.icon} size={22} />
              <Text style={styles.reasonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    padding: spacing.l,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.l,
    lineHeight: typography.lineHeight.body,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: spacing.s,
    borderRadius: borderRadius.small,
    marginBottom: spacing.m,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.error,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.s,
    ...shadows.small,
  },
  reasonButtonDisabled: {
    opacity: 0.6,
  },
  reasonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
