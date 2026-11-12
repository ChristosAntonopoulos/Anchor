import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../components/icons/AppIcon';
import { SystemTile } from '../../components/navigation/SystemTile';
import { colors, spacing, typography, gradients } from '../../constants/designTokens';
import { useMealsStore } from '../../store/useMealsStore';
import { useTodayStore } from '../../store/useTodayStore';
import { useMoneyStore } from '../../store/useMoneyStore';
import { useDeadlinesStore } from '../../store/useDeadlinesStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useWeeklyReviewStore } from '../../store/useWeeklyReviewStore';
import { useCookingStore } from '../../store/useCookingStore';
import { apiClient } from '../../services/api';
import { formatMoney } from '../../utils/walletSpend';
import { WATER_TARGET_GLASSES, findWaterGlasses } from '../../utils/waterReminders';
import { isMorningTakeover, useMorningModeStore } from '../../store/useMorningModeStore';

function daysUntil(dueDate: string): number {
  const due = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(due.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.ceil((due.getTime() - Date.now()) / 86_400_000);
}

export default function SystemsScreen() {
  const router = useRouter();
  const todayCard = useMealsStore((s) => s.todayCard);
  const fetchTodayCard = useMealsStore((s) => s.fetchTodayCard);
  const discipline = useTodayStore((s) => s.data?.discipline);
  const fetchToday = useTodayStore((s) => s.fetchToday);
  const money = useMoneyStore((s) => s.data);
  const fetchMoneySummary = useMoneyStore((s) => s.fetchMoneySummary);
  const deadlines = useDeadlinesStore((s) => s.deadlines);
  const fetchDeadlines = useDeadlinesStore((s) => s.fetchDeadlines);
  const notifications = useNotificationStore((s) => s.backendNotifications);
  const listenerOn = useNotificationStore((s) => s.isEnabled);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const checkStatus = useNotificationStore((s) => s.checkStatus);
  const weekly = useWeeklyReviewStore((s) => s.data);
  const fetchWeeklyReview = useWeeklyReviewStore((s) => s.fetchWeeklyReview);
  const timers = useCookingStore((s) => s.timers);
  const morning = useMorningModeStore((s) => s.session);
  const [unlocksToday, setUnlocksToday] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    await Promise.all([
      fetchTodayCard(),
      fetchToday(),
      fetchMoneySummary(),
      fetchDeadlines(),
      fetchNotifications({ limit: 20 }),
      checkStatus(),
      fetchWeeklyReview(),
      apiClient
        .getPhoneUnlockEntries(start.toISOString())
        .then((entries) => setUnlocksToday(entries.length))
        .catch(() => setUnlocksToday(null)),
    ]);
  }, [
    checkStatus,
    fetchDeadlines,
    fetchMoneySummary,
    fetchNotifications,
    fetchToday,
    fetchTodayCard,
    fetchWeeklyReview,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const runningTimers = timers.filter((t) => t.status === 'running').length;
  const nextMeal = todayCard?.nextMeal;
  const mealsStatus = runningTimers
    ? `${runningTimers} timer${runningTimers === 1 ? '' : 's'} going`
    : nextMeal?.recipeName
      ? `${nextMeal.slot} · ${nextMeal.recipeName}`
      : todayCard?.actionableReminder ?? 'Week plan, pantry, shopping';

  let disciplineDone = 0;
  let disciplineTotal = 0;
  discipline?.blocks.forEach((block) => {
    block.items.forEach((item) => {
      if (item.type === 'toggle') {
        disciplineTotal += 1;
        if (item.toggleValue) disciplineDone += 1;
      }
    });
  });
  const waterGlasses = findWaterGlasses(discipline);
  const disciplineStatus =
    waterGlasses < WATER_TARGET_GLASSES
      ? `${waterGlasses}/${WATER_TARGET_GLASSES} water`
      : disciplineTotal > 0
        ? `${disciplineDone}/${disciplineTotal} checked today`
        : 'Daily checklist';

  const unread = notifications.filter((n) => !n.isRead && !n.isDismissed).length;
  const inboxStatus = !listenerOn
    ? 'Turn on capture'
    : unread > 0
      ? `${unread} waiting`
      : 'Inbox is clear';

  const unlocksStatus =
    unlocksToday == null
      ? 'Why you picked up the phone'
      : unlocksToday === 0
        ? 'No unlocks logged today'
        : `${unlocksToday} today`;

  const walletSpend = money?.monthlyWalletSpend ?? 0;
  const moneyStatus = !listenerOn
    ? 'Connect Google Wallet'
    : walletSpend > 0
      ? `${formatMoney(walletSpend)} Wallet this month`
      : money
        ? money.daysSinceLastIncome >= 14
          ? `${money.daysSinceLastIncome} days since income`
          : `${formatMoney(money.monthlyTotal)} income this month`
        : 'Wallet receipts + income';

  const urgent = deadlines.filter(
    (d) => d.status === 'behind' || (d.daysLeft ?? daysUntil(d.dueDate)) <= 7
  );
  const deadlinesStatus =
    deadlines.length === 0
      ? 'Nothing tracked'
      : urgent.length > 0
        ? `${urgent.length} need a look`
        : `${deadlines.length} on track`;

  const weeklyStatus = weekly?.completed ? 'This week is reviewed' : 'Look back on the week';

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.lede}>The loops around Today — body, attention, money.</Text>

        <Text style={styles.section}>Body</Text>
        <View style={styles.row}>
          <SystemTile
            icon="nutrition"
            title="Meals"
            status={mealsStatus}
            attention={runningTimers > 0}
            onPress={() => router.push('/more/meals' as any)}
          />
          <SystemTile
            icon="habits"
            title="Discipline"
            status={disciplineStatus}
            attention={waterGlasses < WATER_TARGET_GLASSES}
            onPress={() => router.push('/(tabs)/discipline')}
          />
        </View>

        <Text style={styles.section}>Attention</Text>
        <View style={styles.row}>
          <SystemTile
            icon="sun"
            title="Morning"
            status={isMorningTakeover(morning) ? 'In progress' : 'First unlock after 07:00'}
            attention={isMorningTakeover(morning)}
            onPress={() => router.replace('/morning' as never)}
          />
          <SystemTile
            icon="focus"
            title="Unlocks"
            status={unlocksStatus}
            onPress={() => router.push('/(tabs)/unlocks')}
          />
        </View>
        <View style={styles.row}>
          <SystemTile
            icon="notification"
            title="Inbox"
            status={inboxStatus}
            attention={unread > 0}
            onPress={() => router.push('/more/notifications' as any)}
            wide
          />
        </View>

        <Text style={styles.section}>Stewardship</Text>
        <View style={styles.row}>
          <SystemTile
            icon="goals"
            title="Money"
            status={moneyStatus}
            attention={Boolean(!listenerOn || (money && money.daysSinceLastIncome >= 14))}
            onPress={() => router.push('/more/money' as any)}
          />
          <SystemTile
            icon="calendar"
            title="Deadlines"
            status={deadlinesStatus}
            attention={urgent.length > 0}
            onPress={() => router.push('/more/deadlines' as any)}
          />
        </View>

        <Text style={styles.section}>Reflect</Text>
        <SystemTile
          icon="journal"
          title="Weekly review"
          status={weeklyStatus}
          wide
          onPress={() => router.push('/more/weekly-review' as any)}
        />

        <TouchableOpacity
          style={styles.settings}
          onPress={() => router.push('/more/settings' as any)}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <AppIcon name="settings" size={18} color={colors.textSecondary} />
          <Text style={styles.settingsText}>Settings</Text>
          <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
    paddingBottom: spacing.xxl,
    gap: spacing.s,
  },
  lede: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  section: {
    marginTop: spacing.s,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  settings: {
    marginTop: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
  },
  settingsText: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
});
