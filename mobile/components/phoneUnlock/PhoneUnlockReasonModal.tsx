import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { CreatePhoneUnlockEntryRequest } from '../../types';

interface PhoneUnlockReasonModalProps {
  visible: boolean;
  onSubmit: (request: CreatePhoneUnlockEntryRequest) => Promise<void>;
  unlockTime: number; // Timestamp when phone was unlocked
  onClose?: () => void; // Optional close handler (for successful submission)
}

export function PhoneUnlockReasonModal({
  visible,
  onSubmit,
  unlockTime,
  onClose,
}: PhoneUnlockReasonModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    
    if (!trimmedReason) {
      setError('Please enter a reason for unlocking your phone');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      console.log('[PhoneUnlockReasonModal] Submitting unlock entry, unlockTime:', unlockTime);
      
      // Validate unlockTime is a valid number
      if (!unlockTime || isNaN(unlockTime)) {
        throw new Error('Invalid unlock time');
      }
      
      const request = {
        reason: trimmedReason,
        unlockedAt: new Date(unlockTime).toISOString(),
      };
      
      console.log('[PhoneUnlockReasonModal] Request payload:', request);
      
      await onSubmit(request);
      
      console.log('[PhoneUnlockReasonModal] Submit successful');
      
      // Reset form
      setReason('');
      setError(null);
      
      // Close modal on success - add small delay to ensure state updates complete
      // Wrap in try-catch to prevent crashes
      if (onClose) {
        setTimeout(() => {
          try {
            console.log('[PhoneUnlockReasonModal] Calling onClose');
            onClose();
          } catch (closeError) {
            console.error('[PhoneUnlockReasonModal] Error calling onClose:', closeError);
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('[PhoneUnlockReasonModal] Failed to save unlock reason:', err);
      console.error('[PhoneUnlockReasonModal] Error details:', {
        message: err?.message,
        stack: err?.stack,
        response: err?.response,
      });
      
      // Show user-friendly error message
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || 'Failed to save. Please check your connection and try again.';
      
      setError(errorMessage);
      // Don't close modal on error - user needs to retry
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
        // Allow closing only if not loading (prevents accidental closes during submit)
        if (!loading) {
          onClose?.();
        }
      }}
    >
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
    </Modal>
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
