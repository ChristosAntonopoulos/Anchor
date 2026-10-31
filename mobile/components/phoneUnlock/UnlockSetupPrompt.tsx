import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { phoneUnlockListener } from '../../services/phoneUnlockListener';
import { overlayPermission } from '../../services/overlayPermission';

interface UnlockSetupPromptProps {
  onReady?: () => void;
}

export function UnlockSetupPrompt({ onReady }: UnlockSetupPromptProps) {
  const [checking, setChecking] = useState(true);
  const [accessibilityOn, setAccessibilityOn] = useState(false);
  const [overlayOn, setOverlayOn] = useState(false);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setChecking(false);
      onReady?.();
      return;
    }

    try {
      setChecking(true);
      const [accessibility, overlay] = await Promise.all([
        phoneUnlockListener.isAccessibilityServiceEnabled(),
        overlayPermission.isOverlayPermissionGranted(),
      ]);
      setAccessibilityOn(accessibility);
      setOverlayOn(overlay);
      if (accessibility) {
        onReady?.();
      }
    } catch (error) {
      console.error('[UnlockSetupPrompt] Could not check unlock setup', error);
    } finally {
      setChecking(false);
    }
  }, [onReady]);

  useEffect(() => {
    void check();
  }, [check]);

  if (Platform.OS !== 'android' || accessibilityOn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AppIcon name="focus" size={48} />
        </View>
        <Text style={styles.title}>Turn on the unlock popup</Text>
        <Text style={styles.description}>
          Android will not let a normal app jump in front after you unlock. Enable the POS Unlock
          prompt accessibility service. That is what shows Why did you unlock your phone? over the
          home screen.
        </Text>
        <Text style={styles.subDescription}>
          In the list, choose Personal Operating System, then POS Unlock prompt. If the switch is
          greyed out, open the app info, tap the three dots, and allow restricted settings.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => phoneUnlockListener.openAccessibilitySettings()}>
          <LinearGradient
            colors={[colors.category.stability, colors.category.stability + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Open Accessibility settings</Text>
          </LinearGradient>
        </TouchableOpacity>
        {!overlayOn ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              void overlayPermission.requestOverlayPermission();
            }}
          >
            <Text style={styles.secondaryButtonText}>Also allow display over other apps</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.checkButton} onPress={() => void check()}>
          <Text style={styles.checkButtonText}>I turned it on</Text>
        </TouchableOpacity>
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
    marginBottom: spacing.s,
    lineHeight: typography.lineHeight.body,
  },
  subDescription: {
    fontSize: typography.fontSize.caption,
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
  secondaryButton: {
    padding: spacing.s,
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.stability,
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
