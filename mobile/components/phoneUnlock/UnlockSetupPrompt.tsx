import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { overlayPermission } from '../../services/overlayPermission';
import {
  isLockAdminActive,
  isUsageAccessGranted,
  requestLockAdmin,
  requestUsageAccess,
} from '../../services/phoneUnlockListener';

interface UnlockSetupPromptProps {
  onReady?: () => void;
  onOpenExternal?: () => void;
}

type SetupStep = 'overlay' | 'usage' | 'lock';

let usageSkippedSession = false;
let lockSkippedSession = false;

export function UnlockSetupPrompt({ onReady, onOpenExternal }: UnlockSetupPromptProps) {
  const [overlayOn, setOverlayOn] = useState(false);
  const [usageOn, setUsageOn] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [usageSkipped, setUsageSkipped] = useState(usageSkippedSession);
  const [lockSkipped, setLockSkipped] = useState(lockSkippedSession);

  const ready = overlayOn && (usageOn || usageSkipped) && (lockOn || lockSkipped);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') {
      onReady?.();
      return;
    }

    try {
      const overlay = await overlayPermission.isOverlayPermissionGranted();
      const usage = await isUsageAccessGranted();
      const lock = await isLockAdminActive();
      setOverlayOn(overlay);
      setUsageOn(usage);
      setLockOn(lock);
      if (overlay && (usage || usageSkipped) && (lock || lockSkipped)) {
        onReady?.();
      }
    } catch (error) {
      console.error('[UnlockSetupPrompt] Could not check unlock permissions', error);
    }
  }, [onReady, usageSkipped, lockSkipped]);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void check();
      }
    });
    return () => sub.remove();
  }, [check]);

  if (Platform.OS !== 'android' || ready) {
    return null;
  }

  const step: SetupStep = !overlayOn ? 'overlay' : !usageOn && !usageSkipped ? 'usage' : 'lock';

  const copy =
    step === 'overlay'
      ? {
          title: 'Allow the unlock popup',
          description:
            'Android will not let this app jump in front after you unlock. Allow display over other apps so “What brings you to your phone?” can appear on the home screen.',
          button: 'Open overlay settings',
        }
      : step === 'usage'
        ? {
            title: 'Log Cards automatically',
            description:
              'Nothing’s lock-screen Cards button can skip the popup and log Pay. Android needs App usage access for that. POS only checks which app opened after unlock.',
            button: 'Allow app usage',
          }
        : {
            title: 'Allow screen lock',
            description:
              'So Put phone down can turn the screen off. This only lets the app lock the screen. It cannot erase data.',
            button: 'Allow screen lock',
          };

  const openExternal = (open: () => Promise<unknown> | void) => {
    // Device-admin and settings screens are dialogs. Hide this React Native
    // Modal first or they open underneath it and look like a dead button.
    onOpenExternal?.();
    setTimeout(() => {
      void open();
    }, 280);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AppIcon name="focus" size={48} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.description}>{copy.description}</Text>
        <TouchableOpacity
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={copy.button}
          onPress={() => {
            if (step === 'usage') {
              openExternal(() => requestUsageAccess());
              return;
            }
            if (step === 'lock') {
              openExternal(() => requestLockAdmin());
              return;
            }
            openExternal(() => overlayPermission.requestOverlayPermission());
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{copy.button}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkButton} onPress={() => void check()}>
          <Text style={styles.checkButtonText}>I allowed it</Text>
        </TouchableOpacity>
        {step === 'usage' || step === 'lock' ? (
          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => {
              if (step === 'usage') {
                usageSkippedSession = true;
                setUsageSkipped(true);
                if (overlayOn && (lockOn || lockSkipped)) {
                  onReady?.();
                }
                return;
              }
              lockSkippedSession = true;
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
    color: colors.onPrimary,
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
