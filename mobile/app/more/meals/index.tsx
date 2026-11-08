import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../../constants/designTokens';
import { useMealsStore } from '../../../store/useMealsStore';
import { WeekView } from '../../../components/meals/WeekView';
import { PantryView } from '../../../components/meals/PantryView';
import { ShoppingView } from '../../../components/meals/ShoppingView';
import { ErrorBanner } from '../../../components/shared/ErrorBanner';

type Tab = 'week' | 'pantry' | 'shopping';

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'week', label: 'Week', icon: 'calendar-outline' },
  { id: 'pantry', label: 'Pantry', icon: 'nutrition-outline' },
  { id: 'shopping', label: 'Shopping', icon: 'cart-outline' },
];

export default function MealsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('week');
  const [refreshing, setRefreshing] = useState(false);

  const { profile, fetchProfile, activePlan, fetchActivePlan, planLoading, planError } = useMealsStore();

  useEffect(() => {
    fetchProfile();
    fetchActivePlan();
  }, [fetchProfile, fetchActivePlan]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchActivePlan()]);
    setRefreshing(false);
  };

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Meals</Text>
            <Text style={styles.headerSub}>Week, pantry, shopping</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/more/meals/preferences' as any)}
            style={styles.headerAction}
            accessibilityLabel="Meal settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Setup prompt if no profile */}
        {profile && !profile.setupComplete && (
          <TouchableOpacity
            style={styles.setupBanner}
            onPress={() => router.push('/more/meals/preferences' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color={colors.category.work} />
            <Text style={styles.setupBannerText}>
              Set your preferences for better suggestions
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.category.work} />
          </TouchableOpacity>
        )}

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.id }}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={activeTab === tab.id ? colors.category.health : colors.textSecondary}
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {planError ? (
          <ErrorBanner message={planError} onRetry={() => void fetchActivePlan()} />
        ) : null}

        {/* Tab content */}
        <View style={styles.flex}>
          {activeTab === 'week' && (
            <WeekView
              plan={activePlan}
              loading={planLoading}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          )}
          {activeTab === 'pantry' && <PantryView />}
          {activeTab === 'shopping' && <ShoppingView plan={activePlan} />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.s,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  headerAction: {
    padding: spacing.xs,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.work + '15',
    borderBottomWidth: 1,
    borderBottomColor: colors.category.work + '30',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  setupBannerText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing.s,
    gap: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.category.health,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.category.health,
  },
});
