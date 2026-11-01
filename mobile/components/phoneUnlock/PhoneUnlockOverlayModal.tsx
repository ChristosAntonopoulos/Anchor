import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { apiClient } from '../../services/api';
import type { CreatePhoneUnlockEntryRequest } from '../../types';

interface PhoneUnlockOverlayModalProps {
  unlockTime: number; // Timestamp when phone was unlocked
  onClose: () => void; // Callback to close overlay
}

export function PhoneUnlockOverlayModal({
  unlockTime,
  onClose,
}: PhoneUnlockOverlayModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-focus input when overlay opens
    console.log('[PhoneUnlockOverlayModal] Overlay modal opened with unlockTime:', unlockTime);
  }, [unlockTime]);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    
    if (!trimmedReason) {
      setError('Please enter a reason for unlocking your phone');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      await apiClient.createPhoneUnlockEntry({
        reason: trimmedReason,
        unlockedAt: new Date(unlockTime).toISOString(),
      });
      
      console.log('[PhoneUnlockOverlayModal] Unlock entry saved successfully');
      
      // Reset form
      setReason('');
      setError(null);
      
      // Close overlay on success
      onClose();
    } catch (err: any) {
      console.error('[PhoneUnlockOverlayModal] Failed to save unlock reason:', err);
      setError(err?.message || 'Failed to save. Please try again.');
      // Don't close overlay on error - user needs to retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#0F1419', '#1A1F2E', '#0F1419']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AppIcon name="lock-open-outline" size={64} color={colors.category.stability} />
          </View>

          <Text style={styles.title}>Why did you unlock your phone?</Text>
          
          <Text style={styles.description}>
            Take a moment to reflect on your intention. This helps build awareness of your phone usage.
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <AppIcon name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="e.g., Check messages, Look up something, Mindless scrolling..."
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              setError(null); // Clear error when user types
            }}
            multiline
            maxLength={200}
            autoFocus
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, (loading || !reason.trim()) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            <LinearGradient
              colors={
                loading || !reason.trim()
                  ? [colors.border, colors.border]
                  : [colors.category.stability, colors.category.stability + 'CC']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {loading ? 'Saving...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.l,
    ...shadows.small,
  },
  submitButton: {
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
