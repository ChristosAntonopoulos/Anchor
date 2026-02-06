import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, gradients, borderRadius, shadows } from '../../constants/designTokens';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.settingItem}>
                <LinearGradient
                  colors={['#1E2530', '#252B38']}
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
                    trackColor={{ false: colors.border, true: colors.category.work }}
                    thumbColor={colors.surface}
                  />
                </LinearGradient>
              </View>
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
  settingValue: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
});
