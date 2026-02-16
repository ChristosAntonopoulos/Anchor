import { View, Text, StyleSheet, TouchableOpacity, Platform, AppState, AppStateStatus } from 'react-native';
import { useState, useEffect, useRef } from 'react';
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
  const [moduleAvailable, setModuleAvailable] = useState<boolean | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    console.log('[NotificationAccessPrompt] Component mounted, checking status...');
    checkStatus();
    
    // Check status when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[NotificationAccessPrompt] App came to foreground, rechecking status...');
        checkStatus();
      }
      appState.current = nextAppState;
    });

    // Check status every 3 seconds when not enabled (reduced frequency)
    const interval = setInterval(() => {
      if (!isEnabled && !checking) {
        checkStatus();
      }
    }, 3000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const checkStatus = async () => {
    if (Platform.OS !== 'android') {
      console.log('[NotificationAccessPrompt] Not Android platform, hiding prompt');
      setChecking(false);
      return;
    }

    console.log('[NotificationAccessPrompt] Starting status check...');
    setChecking(true);
    setError(null);
    setCheckFailed(false);

    try {
      // Check if native module is available first
      const { NativeModules } = require('react-native');
      const hasModule = !!NativeModules.NotificationListenerModule;
      setModuleAvailable(hasModule);
      
      console.log('[NotificationAccessPrompt] Native module available:', hasModule);
      
      if (!hasModule) {
        console.warn('[NotificationAccessPrompt] NotificationListenerModule not available!');
        setError('Notification module not available. Please rebuild the app.');
        setCheckFailed(true);
        setIsEnabled(false);
        setChecking(false);
        return;
      }

      const enabled = await notificationListener.isEnabled();
      console.log('[NotificationAccessPrompt] Notification access enabled:', enabled);
      
      setIsEnabled(enabled);
      setCheckFailed(false);
      
      if (enabled && onEnabled) {
        console.log('[NotificationAccessPrompt] Access enabled, calling onEnabled callback');
        onEnabled();
      }
      
      setError(null);
    } catch (error: any) {
      console.error('[NotificationAccessPrompt] Error checking notification access:', error);
      const errorMessage = error?.message || 'Failed to check notification access status';
      setError(errorMessage);
      setCheckFailed(true);
      // Fail-safe: assume not enabled if check fails
      setIsEnabled(false);
    } finally {
      setChecking(false);
    }
  };

  const handleOpenSettings = () => {
    try {
      console.log('[NotificationAccessPrompt] Opening notification settings...');
      setError(null);
      notificationListener.openSettings();
    } catch (error: any) {
      console.error('[NotificationAccessPrompt] Error opening settings:', error);
      const errorMessage = error?.message || 'Failed to open settings';
      setError(`Failed to open settings: ${errorMessage}. Please go to Settings → Apps → Special app access → Notification access manually.`);
    }
  };

  const handleRetry = () => {
    console.log('[NotificationAccessPrompt] Manual retry requested');
    checkStatus();
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

  // Only hide if explicitly confirmed as enabled (not on error)
  if (isEnabled && !checkFailed && !error) {
    console.log('[NotificationAccessPrompt] Access enabled, hiding prompt');
    return null; // Hide completely when enabled
  }

  // Show prompt if:
  // - Not enabled, OR
  // - Check failed, OR
  // - Error occurred, OR
  // - Module unavailable
  console.log('[NotificationAccessPrompt] Showing prompt - enabled:', isEnabled, 'checkFailed:', checkFailed, 'error:', error, 'moduleAvailable:', moduleAvailable);

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

        {moduleAvailable === false && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color={colors.error || '#FF6B6B'} />
            <Text style={styles.errorText}>
              Native notification module not found. Please rebuild the app with native code.
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.enableButton, styles.primaryButton]}
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

          {(checkFailed || error) && (
            <TouchableOpacity
              style={[styles.enableButton, styles.retryButton]}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <View style={styles.retryButtonContent}>
                <Ionicons name="refresh-outline" size={20} color={colors.category.work} />
                <Text style={styles.retryButtonText}>Check Again</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  primaryButton: {
    flex: 1,
  },
  retryButton: {
    flex: 0,
    minWidth: 120,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.category.work,
    backgroundColor: 'transparent',
  },
  retryButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
});
