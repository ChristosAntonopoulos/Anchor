import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { overlayPermission } from '../../services/overlayPermission';
import { isLockAdminActive, requestLockAdmin } from '../../services/phoneUnlockListener';

interface UnlockSetupPromptProps {
  onReady?: () => void;
}

export function UnlockSetupPrompt({ onReady }: UnlockSetupPromptProps) {
  const [overlayOn, setOverlayOn] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [lockSkipped, setLockSkipped] = useState(false);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') {
      onReady?.();
      return;
    }

    try {
      const overlay = await overlayPermission.isOverlayPermissionGranted();
      const lock = await isLockAdminActive();
      setOverlayOn(overlay);
      setLockOn(lock);
      if (overlay && (lock || lockSkipped)) {
        onReady?.();
      }
    } catch (error) {
      console.error('[UnlockSetupPrompt] Could not check overlay permission', error);
    }
  }, [onReady, lockSkipped]);

  useEffect(() => {
    void check();
  }, [check]);

  if (Platform.OS !== 'android' || (overlayOn && (lockOn || lockSkipped))) {
    return null;
  }

  const askingLock = overlayOn && !lockOn && !lockSkipped;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AppIcon name="focus" size={48} />
        </View>
        <Text style={styles.title}>
          {askingLock ? 'Allow screen lock' : 'Allow the unlock popup'}
        </Text>
        <Text style={styles.description}>
          {askingLock
            ? 'So Put phone down can turn the screen off. This only lets the app lock the screen. It cannot erase data.'
            : 'Android will not let this app jump in front after you unlock. Allow display over other apps so “What brings you to your phone?” can appear on the home screen.'}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (askingLock) {
              requestLockAdmin();
              return;
            }
            void overlayPermission.requestOverlayPermission();
          }}
        >
          <LinearGradient
            colors={[colors.category.stability, colors.category.stability + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {askingLock ? 'Allow screen lock' : 'Open overlay settings'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkButton} onPress={() => void check()}>
          <Text style={styles.checkButtonText}>I allowed it</Text>
        </TouchableOpacity>
        {askingLock ? (
          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => {
              setLockSkipped(true);
              onReady?.();
            }}
          >
            <Text style={styles.checkButtonText}>Later</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.l,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.l,
    ...shadows.medium,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.m,
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
  button: {
    borderRadius: borderRadius.medium,
    marginBottom: spacing.m,
    ...shadows.small,
  },
  buttonGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  checkButton: {
    padding: spacing.s,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.stability,
    textDecorationLine: 'underline',
  },
});
