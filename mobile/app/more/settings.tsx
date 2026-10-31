import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, gradients, borderRadius, shadows } from '../../constants/designTokens';
import {
  getUnlockPromptStatus,
  openOverlaySettings,
  requestUnlockNotificationPermission,
  setUnlockPromptEnabled,
  type UnlockPromptStatus,
} from 'phone-unlock';

const choiceLabels: Record<string, string> = {
  no_reason: 'No reason',
  task: 'A task',
  message: 'A message',
};

export default function SettingsScreen() {
  const [status, setStatus] = useState<UnlockPromptStatus | null>(null);

  const refresh = useCallback(() => {
    setStatus(getUnlockPromptStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onToggle = (enabled: boolean) => {
    if (enabled) {
      requestUnlockNotificationPermission();
    }
    setUnlockPromptEnabled(enabled);
    const next = getUnlockPromptStatus();
    setStatus(next);
    if (enabled && !next.overlayGranted && !next.unavailable) {
      openOverlaySettings();
    }
  };

  const enabled = status?.enabled ?? false;
  const lastChoice = status?.lastChoice ? choiceLabels[status.lastChoice] ?? status.lastChoice : null;

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phone unlock</Text>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={['#1E2530', '#252B38']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Ask when I unlock</Text>
                    <Text style={styles.settingDescription}>
                      When you unlock the phone, a popup offers No reason, A task, and A message. A quiet notification stays on while this is enabled.
                    </Text>
                    {status?.unavailable ? (
                      <Text style={styles.settingHint}>
                        Rebuild the Android app to include this popup. Expo Go cannot show it.
                      </Text>
                    ) : null}
                    {lastChoice ? (
                      <Text style={styles.settingHint}>Last answer: {lastChoice}</Text>
                    ) : null}
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    disabled={status?.unavailable ?? false}
                    trackColor={{ false: colors.border, true: colors.category.work }}
                    thumbColor={colors.surface}
                  />
                </LinearGradient>
              </View>

              {enabled && status && !status.overlayGranted ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={openOverlaySettings}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>Allow display over other apps</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={['#1E2530', '#252B38']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <Text style={styles.settingLabel}>Version</Text>
                  <Text style={styles.settingValue}>1.0.0</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    marginBottom: spacing.m,
  },
  settingCard: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.small,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.m,
  },
  settingLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  settingHint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.s,
  },
  settingValue: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
  },
  actionButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
});
