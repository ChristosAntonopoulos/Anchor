import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { overlayPermission } from '../../services/overlayPermission';

interface OverlayPermissionPromptProps {
  onPermissionGranted?: () => void;
}

export function OverlayPermissionPrompt({ onPermissionGranted }: OverlayPermissionPromptProps) {
  const [isGranted, setIsGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS !== 'android') {
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      const granted = await overlayPermission.isOverlayPermissionGranted();
      setIsGranted(granted);
      
      if (granted && onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (error) {
      console.error('[OverlayPermissionPrompt] Error checking permission:', error);
      setIsGranted(false);
    } finally {
      setChecking(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      await overlayPermission.requestOverlayPermission();
      // Wait a bit for user to grant permission, then check again
      setTimeout(() => {
        checkPermission();
      }, 1000);
    } catch (error) {
      console.error('[OverlayPermissionPrompt] Error requesting permission:', error);
    }
  };

  if (Platform.OS !== 'android') {
    return null;
  }

  if (checking) {
    return (
      <View style={styles.container}>
        <Text style={styles.checkingText}>Checking permission...</Text>
      </View>
    );
  }

  if (isGranted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AppIcon name="layers-outline" size={48} color={colors.category.stability} />
        </View>

        <Text style={styles.title}>Enable Overlay Permission</Text>
        
        <Text style={styles.description}>
          To show the unlock reason prompt when your phone is unlocked, we need permission to display over other apps.
        </Text>

        <Text style={styles.subDescription}>
          This allows the app to show the prompt even when it's in the background.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestPermission}
        >
          <LinearGradient
            colors={[colors.category.stability, colors.category.stability + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <AppIcon name="settings-outline" size={20} color={colors.background} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Open Settings</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkPermission}
        >
          <Text style={styles.checkButtonText}>I've granted permission</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
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
  checkingText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
