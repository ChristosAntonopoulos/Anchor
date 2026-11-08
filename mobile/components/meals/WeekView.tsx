import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { MealPlan, MealSlot } from '../../types/meals';

interface WeekViewProps {
  plan: MealPlan | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

const SLOT_LABELS: Record<string, string> = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Dinner: 'Dinner',
  Snack: 'Snack',
};

const KIND_LABELS: Record<string, string> = {
  FreshCook: 'Cook',
  Leftovers: 'Leftovers',
  FrozenPortion: 'Frozen',
  NoCook: 'No cook',
  EatingOut: 'Eating out',
};

const STATE_COLORS: Record<string, string> = {
  Planned: colors.textSecondary,
  Cooked: colors.category.leverage,
  PartlyCooked: colors.warning,
  Skipped: colors.error,
  EatingOut: colors.category.work,
};

function MealSlotCard({ slot, onPress }: { slot: MealSlot; onPress: () => void }) {
  const stateColor = STATE_COLORS[slot.state] ?? colors.textSecondary;

  return (
    <TouchableOpacity style={styles.slotCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.slotCardInner}>
        <View style={[styles.slotDot, { backgroundColor: stateColor }]} />
        <View style={styles.slotContent}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotKind}>{SLOT_LABELS[slot.slot] ?? slot.slot}</Text>
            {slot.locked && (
              <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
            )}
          </View>
          <Text style={styles.slotName} numberOfLines={1}>
            {slot.recipeName ?? KIND_LABELS[slot.kind] ?? slot.kind}
          </Text>
          {(slot.handsonMinutes || slot.totalMinutes) && (
            <Text style={styles.slotTimes}>
              {slot.handsonMinutes ? `${slot.handsonMinutes} min hands-on` : ''}
              {slot.handsonMinutes && slot.totalMinutes ? ' · ' : ''}
              {slot.totalMinutes ? `${slot.totalMinutes} min total` : ''}
            </Text>
          )}
          {slot.reasonSummary && (
            <Text style={styles.slotReason} numberOfLines={1}>
              {slot.reasonSummary}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

function DaySection({ date, slots, isToday }: { date: string; slots: MealSlot[]; isToday: boolean }) {
  const router = useRouter();
  const d = new Date(date + 'T00:00:00');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;

  return (
    <View style={[styles.daySection, isToday && styles.daySectionToday]}>
      <View style={styles.dayHeader}>
        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        )}
      </View>
      {slots.length === 0 ? (
        <Text style={styles.emptyDay}>No meal planned</Text>
      ) : (
        slots.map((slot) => (
          <MealSlotCard
            key={slot.id}
            slot={slot}
            onPress={() => router.push(`/more/meals/slot/${slot.id}` as any)}
          />
        ))
      )}
    </View>
  );
}

export function WeekView({ plan, loading, refreshing, onRefresh }: WeekViewProps) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  if (loading && !plan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.category.health} />
      </View>
    );
  }

  if (!plan) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.emptyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.health} />}
      >
        <Ionicons name="restaurant-outline" size={48} color={colors.border} />
        <Text style={styles.emptyTitle}>No week plan</Text>
        <Text style={styles.emptyText}>
          Plan the week, or ask for help with today
        </Text>
        <TouchableOpacity
          style={styles.planBtn}
          onPress={() => router.push('/more/meals/plan' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={16} color={colors.background} />
          <Text style={styles.planBtnText}>Plan the week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tonightBtn}
          onPress={() => router.push('/more/meals/tonight' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.tonightBtnText}>What am I eating tonight?</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Group slots by date
  const slotsByDate = plan.slots.reduce<Record<string, MealSlot[]>>((acc, slot) => {
    if (!acc[slot.localDate]) acc[slot.localDate] = [];
    acc[slot.localDate].push(slot);
    return acc;
  }, {});

  // Build date range
  const start = new Date(plan.weekStartDate);
  const end = new Date(plan.weekEndDate);
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.weekContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.health} />}
    >
      {/* Plan actions header */}
      <View style={styles.planActions}>
        <TouchableOpacity
          style={styles.actionChip}
          onPress={() => router.push('/more/meals/plan' as any)}
        >
          <Ionicons name="pencil-outline" size={14} color={colors.category.work} />
          <Text style={styles.actionChipText}>Edit plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionChip}
          onPress={() => router.push('/more/meals/plan' as any)}
        >
          <Ionicons name="refresh-outline" size={14} color={colors.category.work} />
          <Text style={styles.actionChipText}>New plan</Text>
        </TouchableOpacity>
      </View>

      {dates.map((date) => (
        <DaySection
          key={date}
          date={date}
          slots={slotsByDate[date] ?? []}
          isToday={date === today}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.m,
  },
  emptyTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.caption,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    ...shadows.medium,
  },
  planBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  tonightBtn: {
    paddingVertical: spacing.s,
  },
  tonightBtnText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  weekContent: { padding: spacing.m, gap: spacing.m, paddingBottom: spacing.xxl },
  planActions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionChipText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontWeight: typography.fontWeight.semibold,
  },
  daySection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.small,
  },
  daySectionToday: {
    borderColor: colors.category.health + '60',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s,
  },
  dayLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayLabelToday: {
    color: colors.category.health,
  },
  todayBadge: {
    backgroundColor: colors.category.health + '20',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.health,
  },
  emptyDay: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    padding: spacing.m,
    fontStyle: 'italic',
  },
  slotCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slotCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.s,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotContent: { flex: 1 },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  slotKind: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  slotTimes: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  slotReason: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
