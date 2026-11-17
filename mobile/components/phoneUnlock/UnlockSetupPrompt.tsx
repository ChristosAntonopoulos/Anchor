import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
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

type SetupStep = 'usage' | 'lock';

let usageSkippedSession = false;
let lockSkippedSession = false;

/**
 * Optional permissions after the intention popup was removed.
 * Usage access: wallet Pay auto-log + first app after unlock.
 * Lock admin: still useful if other flows request a screen lock.
 */
export function UnlockSetupPrompt({ onReady, onOpenExternal }: UnlockSetupPromptProps) {
  const [usageOn, setUsageOn] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [usageSkipped, setUsageSkipped] = useState(usageSkippedSession);
  const [lockSkipped, setLockSkipped] = useState(lockSkippedSession);

  const ready = (usageOn || usageSkipped) && (lockOn || lockSkipped);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') {
      onReady?.();
      return;
    }

    try {
      const usage = await isUsageAccessGranted();
      const lock = await isLockAdminActive();
      setUsageOn(usage);
      setLockOn(lock);
      if ((usage || usageSkipped) && (lock || lockSkipped)) {
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

  const step: SetupStep = !usageOn && !usageSkipped ? 'usage' : 'lock';

  const copy =
    step === 'usage'
      ? {
          title: 'Log unlocks with more detail',
          description:
            'App usage access lets Anchor note which app you open first after unlock, and log lock-screen Cards as Pay. Unlock timestamps still record without this.',
          button: 'Allow app usage',
        }
      : {
          title: 'Allow screen lock',
          description:
            'Lets Anchor turn the screen off when a flow asks to put the phone down. It cannot erase data.',
          button: 'Allow screen lock',
        };

  const openExternal = (open: () => Promise<unknown> | void) => {
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
            openExternal(() => requestLockAdmin());
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
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => {
            if (step === 'usage') {
              usageSkippedSession = true;
              setUsageSkipped(true);
              if (lockOn || lockSkipped) {
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
