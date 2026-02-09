import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { notificationListener } from '../../services/notificationListener';

interface NotificationAccessPromptProps {
  onEnabled?: () => void;
}

export function NotificationAccessPrompt({ onEnabled }: NotificationAccessPromptProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    // Check status every 2 seconds when not enabled
    const interval = setInterval(() => {
      if (!isEnabled) {
        checkStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  const checkStatus = async () => {
    if (Platform.OS !== 'android') {
      setChecking(false);
      return;
    }

    try {
      const enabled = await notificationListener.isEnabled();
      setIsEnabled(enabled);
      if (enabled && onEnabled) {
        onEnabled();
      }
      setError(null);
    } catch (error) {
      console.error('Error checking notification access:', error);
      setError('Failed to check notification access status');
    } finally {
      setChecking(false);
    }
  };

  const handleOpenSettings = () => {
    try {
      setError(null);
      notificationListener.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      setError('Failed to open settings. Please go to Settings → Apps → Special app access → Notification access manually.');
    }
  };

  if (Platform.OS !== 'android') {
    return null; // Only show on Android
  }

  if (checking) {
    return (
      <View style={styles.container}>
        <Text style={styles.checkingText}>Checking notification access...</Text>
      </View>
    );
  }

  if (isEnabled) {
    return null; // Hide completely when enabled
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promptCard}
      >
        <View style={styles.header}>
          <Ionicons name="notifications-outline" size={32} color={colors.category.work} />
          <Text style={styles.title}>Enable Notification Access</Text>
        </View>
        
        <Text style={styles.description}>
          Allow POS to read notifications from other apps. This helps automatically create tasks from:
        </Text>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.benefitText}>Calendar events and meetings</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.benefitText}>Email reminders</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="chatbubbles-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.benefitText}>Message notifications</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.error || '#FF6B6B'} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.enableButton}
          onPress={handleOpenSettings}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.category.work, colors.category.work + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.enableButtonGradient}
          >
            <Ionicons name="settings-outline" size={20} color={colors.background} />
            <Text style={styles.enableButtonText}>Open Settings</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tap "Open Settings" to go to Notification access settings. Then find and enable "Personal Operating System" in the list.
        </Text>
        <Text style={styles.hintSecondary}>
          Note: This is different from regular app permissions. Look for "Notification access" in Settings → Apps → Special app access.
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    marginTop: spacing.m,
  },
  checkingText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.m,
  },
  enabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.category.work + '40',
  },
  enabledText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  promptCard: {
    borderRadius: borderRadius.medium,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.m,
    lineHeight: 20,
  },
  benefitsList: {
    marginBottom: spacing.l,
    gap: spacing.s,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.xs,
  },
  benefitText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  enableButton: {
    borderRadius: borderRadius.medium,
    marginBottom: spacing.s,
    ...shadows.small,
  },
  enableButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
  },
  enableButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  hintSecondary: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: (colors.error || '#FF6B6B') + '20',
    borderRadius: borderRadius.small,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: (colors.error || '#FF6B6B') + '40',
  },
  errorText: {
    fontSize: typography.fontSize.caption,
    color: colors.error || '#FF6B6B',
    flex: 1,
  },
});
