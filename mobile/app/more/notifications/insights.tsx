import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, typography, borderRadius, shadows } from '../../../constants/designTokens';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { LinearGradient as LG } from 'expo-linear-gradient';

export default function NotificationInsightsScreen() {
  const { insights, loading, fetchInsights } = useNotificationStore();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const endDate = new Date().toISOString();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90));
    fetchInsights(startDate.toISOString(), endDate);
  }, [dateRange, fetchInsights]);

  if (loading && !insights) {
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

  if (!insights) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No insights available</Text>
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
          <View style={styles.header}>
            <Text style={styles.title}>Notification Insights</Text>
          </View>

          <View style={styles.statsContainer}>
            <LG colors={['#1E2530', '#252B38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
              <Text style={styles.statValue}>{insights.totalNotifications}</Text>
              <Text style={styles.statLabel}>Total Notifications</Text>
            </LG>
            <LG colors={['#1E2530', '#252B38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
              <Text style={styles.statValue}>{insights.taskRelevantCount}</Text>
              <Text style={styles.statLabel}>Task-Relevant</Text>
            </LG>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Active Apps</Text>
            {insights.mostActiveApps.slice(0, 10).map((app, index) => (
              <LG
                key={app.packageName}
                colors={['#1E2530', '#252B38']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.appCard}
              >
                <Text style={styles.appRank}>{index + 1}</Text>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.appName || app.packageName}</Text>
                  <Text style={styles.appPackage}>{app.packageName}</Text>
                </View>
                <Text style={styles.appCount}>{app.count}</Text>
              </LG>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications by Hour</Text>
            <View style={styles.hourChart}>
              {insights.notificationsByHour.map((slot) => (
                <View key={slot.hour} style={styles.hourBar}>
                  <View style={[styles.bar, { height: Math.max(20, (slot.count / Math.max(...insights.notificationsByHour.map(s => s.count))) * 100) }]} />
                  <Text style={styles.hourLabel}>{slot.hour}</Text>
                  <Text style={styles.hourCount}>{slot.count}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications by Day</Text>
            {insights.notificationsByDay.map((day) => (
              <LG
                key={day.dayOfWeek}
                colors={['#1E2530', '#252B38']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dayCard}
              >
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Text style={styles.dayCount}>{day.count}</Text>
              </LG>
            ))}
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
  header: {
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.m,
    gap: spacing.m,
  },
  statCard: {
    flex: 1,
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.small,
  },
  statValue: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.work,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s,
    ...shadows.small,
  },
  appRank: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.work,
    width: 30,
  },
  appInfo: {
    flex: 1,
    marginLeft: spacing.m,
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
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  hourChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingVertical: spacing.m,
  },
  hourBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: colors.category.work,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
  },
  hourLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  hourCount: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  dayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s,
    ...shadows.small,
  },
  dayName: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  dayCount: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
});
