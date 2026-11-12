import { View, Text, StyleSheet, ScrollView, Switch, Pressable, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, gradients, borderRadius, shadows } from '../../constants/designTokens';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { useCheckInStore } from '../../store/useCheckInStore';
import { useExecutionStore } from '../../store/useExecutionStore';
import { ExecutionProfileCard } from '../../components/execution/ExecutionProfileCard';
import { hasLauncherModule, previewHome, useAsHome } from '../../services/launcherNative';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const usePreviousEntries = useCheckInStore((state) => state.usePreviousEntries);
  const profile = useExecutionStore((state) => state.profile);
  const fetchProfile = useExecutionStore((state) => state.fetchProfile);
  const saveProfile = useExecutionStore((state) => state.saveProfile);
  const review = useExecutionStore((state) => state.review);
  const runReview = useExecutionStore((state) => state.runReview);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

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
            {profile ? (
              <View style={styles.section}>
                <ExecutionProfileCard
                  profile={profile}
                  onChange={(patch) => void saveProfile(patch)}
                  review={review}
                  onReview={() => void runReview()}
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={[colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Enable Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive daily reminders and updates
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Check-in</Text>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={[colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Self-help tools</Text>
                    <Text style={styles.settingDescription}>{CHECK_IN_COPY.landingSupport}</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={[colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Use earlier check-ins for suggestions</Text>
                    <Text style={styles.settingDescription}>
                      Off by default. When on, only your own saved entries can help rank reviewed steps. Entries are not sent to a model in this version.
                    </Text>
                  </View>
                  <Switch
                    value={usePreviousEntries}
                    onValueChange={(value) => useCheckInStore.setState({ usePreviousEntries: value })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                    accessibilityLabel="Use earlier check-ins for suggestions"
                  />
                </LinearGradient>
              </View>
              <CrisisCard />
            </View>

            {hasLauncherModule ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Home screen</Text>
                <Pressable
                  onPress={() => void previewHome()}
                  style={styles.settingItem}
                  accessibilityRole="button"
                  accessibilityLabel="Preview Home"
                >
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.settingCard}
                  >
                    <View style={styles.settingContent}>
                      <Text style={styles.settingLabel}>Preview Home</Text>
                      <Text style={styles.settingDescription}>
                        Open the launcher as it will look: Next, Today, favorites, and a dock for Wallet, ChatGPT, Cursor, and Spotify.
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => void useAsHome()}
                  style={styles.settingItem}
                  accessibilityRole="button"
                  accessibilityLabel="Use Personal AI as Home"
                >
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.settingCard}
                  >
                    <View style={styles.settingContent}>
                      <Text style={styles.settingLabel}>Use Personal AI as Home</Text>
                      <Text style={styles.settingDescription}>
                        Android will ask you to set this app as the Home app. Switch home screen later to return to the stock launcher.
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Focus</Text>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/more/distraction-guard' as any)}
                accessibilityRole="button"
                accessibilityLabel="Open Distraction Guard"
              >
                <LinearGradient
                  colors={[colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.settingCard}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Distraction Guard</Text>
                    <Text style={styles.settingDescription}>
                      Limit selected apps, cooldown, and opening pause
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={[colors.surface, colors.surface]}
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
  settingValue: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
});
