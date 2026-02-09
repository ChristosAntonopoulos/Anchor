import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography, borderRadius, shadows } from '../../../constants/designTokens';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { apiClient } from '../../../services/api';

export default function NotificationSettingsScreen() {
  const { settings, loading, fetchSettings, updateSettings, fetchNotifications } = useNotificationStore();
  const [apps, setApps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [retentionDays, setRetentionDays] = useState(30);
  const [customKeywords, setCustomKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (settings) {
      setRetentionDays(settings.retentionDays);
      setCustomKeywords(settings.customKeywords.join(', '));
    }
  }, [settings]);

  const loadData = async () => {
    await fetchSettings();
    try {
      const appList = await apiClient.getNotificationApps();
      setApps(appList);
    } catch (error) {
      console.error('Error loading apps:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        retentionDays,
        customKeywords: customKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleAppWhitelist = async (packageName: string) => {
    if (!settings) return;

    const isWhitelisted = settings.whitelistedApps.includes(packageName);
    const newWhitelist = isWhitelisted
      ? settings.whitelistedApps.filter(p => p !== packageName)
      : [...settings.whitelistedApps, packageName];

    await updateSettings({ whitelistedApps: newWhitelist });
  };

  const toggleAppBlacklist = async (packageName: string) => {
    if (!settings) return;

    const isBlacklisted = settings.blacklistedApps.includes(packageName);
    const newBlacklist = isBlacklisted
      ? settings.blacklistedApps.filter(p => p !== packageName)
      : [...settings.blacklistedApps, packageName];

    await updateSettings({ blacklistedApps: newBlacklist });
  };

  const filteredApps = apps.filter(app =>
    (app.appName || app.packageName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !settings) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.category.work} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!settings) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Settings not available</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retention Period</Text>
            <LinearGradient colors={['#1E2530', '#252B38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.settingCard}>
              <Text style={styles.settingLabel}>Keep notifications for (days)</Text>
              <TextInput
                style={styles.numberInput}
                value={retentionDays.toString()}
                onChangeText={(text) => setRetentionDays(parseInt(text) || 30)}
                keyboardType="numeric"
              />
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Keywords</Text>
            <LinearGradient colors={['#1E2530', '#252B38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.settingCard}>
              <Text style={styles.settingLabel}>Task-relevant keywords (comma-separated)</Text>
              <TextInput
                style={styles.textInput}
                value={customKeywords}
                onChangeText={setCustomKeywords}
                placeholder="meeting, deadline, reminder..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Filtering</Text>
            <LinearGradient colors={['#1E2530', '#252B38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </LinearGradient>

            <View style={styles.appList}>
              {filteredApps.map((app) => {
                const isWhitelisted = settings.whitelistedApps.includes(app.packageName);
                const isBlacklisted = settings.blacklistedApps.includes(app.packageName);

                return (
                  <LinearGradient
                    key={app.packageName}
                    colors={['#1E2530', '#252B38']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.appItem}
                  >
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.appName || app.packageName}</Text>
                      <Text style={styles.appPackage}>{app.packageName}</Text>
                      <Text style={styles.appCount}>{app.count} notifications</Text>
                    </View>
                    <View style={styles.appToggles}>
                      <TouchableOpacity
                        onPress={() => toggleAppWhitelist(app.packageName)}
                        style={[styles.toggleButton, isWhitelisted && styles.toggleButtonActive]}
                      >
                        <Text style={[styles.toggleText, isWhitelisted && styles.toggleTextActive]}>Allow</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleAppBlacklist(app.packageName)}
                        style={[styles.toggleButton, isBlacklisted && styles.toggleButtonActive]}
                      >
                        <Text style={[styles.toggleText, isBlacklisted && styles.toggleTextActive]}>Block</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            <LinearGradient
              colors={[colors.category.work, colors.category.work + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={colors.background} />
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  settingLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  numberInput: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    backgroundColor: colors.border + '20',
    padding: spacing.s,
    borderRadius: borderRadius.small,
  },
  textInput: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    backgroundColor: colors.border + '20',
    padding: spacing.s,
    borderRadius: borderRadius.small,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  appList: {
    gap: spacing.s,
  },
  appItem: {
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  appInfo: {
    marginBottom: spacing.s,
  },
  appName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  appPackage: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  appCount: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  appToggles: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  toggleButton: {
    flex: 1,
    padding: spacing.s,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.category.work,
    borderColor: colors.category.work,
  },
  toggleText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.background,
    fontWeight: typography.fontWeight.semibold,
  },
  saveButton: {
    margin: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.m,
    gap: spacing.s,
  },
  saveButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
