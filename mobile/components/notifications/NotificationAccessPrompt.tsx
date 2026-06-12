import { View, Text, StyleSheet, TouchableOpacity, Platform, AppState, AppStateStatus } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { notificationListener } from '../../services/notificationListener';
import { hasNotificationListenerModule, isExpoGo } from '../../utils/nativeModuleSupport';

interface NotificationAccessPromptProps {
  onEnabled?: () => void;
}

export function NotificationAccessPrompt({ onEnabled }: NotificationAccessPromptProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleAvailable, setModuleAvailable] = useState<boolean | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  const [isNothingPhone, setIsNothingPhone] = useState(false);
  const [settingsMethod, setSettingsMethod] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    console.log('[NotificationAccessPrompt] Component mounted, checking status...');
    checkDeviceInfo();
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
  
  const checkDeviceInfo = async () => {
    try {
      const deviceInfo = await notificationListener.getDeviceInfo();
      const isNothing = deviceInfo.manufacturer?.toLowerCase().includes('nothing') || 
                       deviceInfo.brand?.toLowerCase().includes('nothing');
      setIsNothingPhone(isNothing);
      console.log('[NotificationAccessPrompt] Device info:', deviceInfo, 'Is Nothing Phone:', isNothing);
    } catch (error) {
      console.warn('[NotificationAccessPrompt] Could not get device info:', error);
    }
  };

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
      const hasModule = hasNotificationListenerModule;
      setModuleAvailable(hasModule);
      
      if (!hasModule) {
        setError('Notification module not available. Run: npx expo run:android');
        setCheckFailed(true);
        setIsEnabled(false);
        setChecking(false);
        return;
      }

      // isEnabled() now returns false gracefully instead of throwing
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

  const handleOpenSettings = async () => {
    try {
      console.log('[NotificationAccessPrompt] Opening notification settings...');
      setError(null);
      
      // Check if module is available before trying to open settings
      const { NativeModules } = require('react-native');
      const hasModule = !!NativeModules.NotificationListenerModule;
      
      if (!hasModule) {
        setError('Notification module not available. Cannot open settings. Please rebuild the app with native code enabled.');
        return;
      }
      
      // openSettings() now returns a promise with the method used
      const method = await notificationListener.openSettings();
      setSettingsMethod(method);
      console.log('[NotificationAccessPrompt] Settings opened using method:', method);
      
      // Give it a moment, then check if settings were actually opened
      setTimeout(() => {
        checkStatus();
      }, 1000);
    } catch (error: any) {
      console.error('[NotificationAccessPrompt] Error opening settings:', error);
      const errorMessage = error?.message || 'Failed to open settings';
      
      // Show Nothing Phone specific instructions if it's a Nothing Phone
      if (isNothingPhone) {
        setError(`Could not open settings automatically. Please follow these steps manually:\n\n1. Go to Settings\n2. Tap "Apps"\n3. Tap "Special app access"\n4. Tap "Notification access"\n5. Find "Personal Operating System" and toggle it ON`);
      } else {
        setError(`Failed to open settings: ${errorMessage}. Please go to Settings → Apps → Special app access → Notification access manually.`);
      }
    }
  };

  const handleRetry = () => {
    console.log('[NotificationAccessPrompt] Manual retry requested');
    checkStatus();
  };

  if (Platform.OS !== 'android' || isExpoGo) {
    return null;
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
              Native notification module not found. This feature requires a development build with native code. The notification access feature will not be available in this build.
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

        {isNothingPhone && settingsMethod !== 'standard' && (
          <View style={styles.nothingPhoneInstructions}>
            <Ionicons name="information-circle-outline" size={20} color={colors.category.work} />
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionsTitle}>Nothing Phone Instructions:</Text>
              <Text style={styles.instructionsText}>
                1. Go to Settings{'\n'}
                2. Tap "Apps"{'\n'}
                3. Tap "Special app access"{'\n'}
                4. Tap "Notification access"{'\n'}
                5. Find "Personal Operating System" and toggle it ON
              </Text>
            </View>
          </View>
        )}
        
        {!isNothingPhone && (
          <>
            <Text style={styles.hint}>
              Tap "Open Settings" to go to Notification access settings. Then find and enable "Personal Operating System" in the list.
            </Text>
            <Text style={styles.hintSecondary}>
              Note: This is different from regular app permissions. Look for "Notification access" in Settings → Apps → Special app access.
            </Text>
          </>
        )}
        
        {isNothingPhone && settingsMethod === 'standard' && (
          <Text style={styles.hint}>
            Tap "Open Settings" to go to Notification access settings. Then find and enable "Personal Operating System" in the list.
          </Text>
        )}
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
  nothingPhoneInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.category.work + '15',
    borderRadius: borderRadius.small,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.category.work + '30',
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
    marginBottom: spacing.xs,
  },
  instructionsText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
