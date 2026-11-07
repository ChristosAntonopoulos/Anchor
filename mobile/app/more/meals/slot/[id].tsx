import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../../../constants/designTokens';
import { useMealsStore } from '../../../../store/useMealsStore';

const SLOT_LABELS: Record<string, string> = {
  Breakfast: 'Πρωινό',
  Lunch: 'Μεσημεριανό',
  Dinner: 'Βραδινό',
  Snack: 'Σνακ',
};

const KIND_LABELS: Record<string, string> = {
  FreshCook: 'Μαγείρεμα',
  Leftovers: 'Υπολείμματα',
  FrozenPortion: 'Κατεψυγμένο',
  NoCook: 'Χωρίς μαγείρεμα',
  EatingOut: 'Εξω',
};

export default function MealSlotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activePlan, fetchActivePlan } = useMealsStore();

  React.useEffect(() => {
    if (!activePlan) void fetchActivePlan();
  }, [activePlan, fetchActivePlan]);

  const slot = activePlan?.slots.find((s) => s.id === id);

  return (
    <LinearGradient colors={gradients.background.colors} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {slot ? SLOT_LABELS[slot.slot] ?? slot.slot : 'Γεύμα'}
            </Text>
            {slot?.localDate && (
              <Text style={styles.headerSub}>
                {new Date(slot.localDate + 'T00:00:00').toLocaleDateString('el-GR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            )}
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {!slot ? (
            <View style={styles.notFound}>
              <Text style={styles.notFoundText}>Το γεύμα δεν βρέθηκε</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.mealName}>
                  {slot.recipeName ?? KIND_LABELS[slot.kind] ?? slot.kind}
                </Text>
                {(slot.handsonMinutes || slot.totalMinutes) && (
                  <View style={styles.metaRow}>
                    {slot.handsonMinutes && (
                      <View style={styles.metaItem}>
                        <Ionicons name="hand-left-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{slot.handsonMinutes} λεπτά χειρισμός</Text>
                      </View>
                    )}
                    {slot.totalMinutes && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{slot.totalMinutes} λεπτά σύνολο</Text>
                      </View>
                    )}
                  </View>
                )}
                {slot.reasonSummary && (
                  <View style={styles.reasonRow}>
                    <Ionicons name="sparkles" size={14} color={colors.category.work} />
                    <Text style={styles.reasonText}>{slot.reasonSummary}</Text>
                  </View>
                )}
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Κατάσταση:</Text>
                  <Text style={styles.statusValue}>{slot.state}</Text>
                </View>
                {slot.locked && (
                  <View style={styles.lockedRow}>
                    <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
                    <Text style={styles.lockedText}>Κλειδωμένο γεύμα</Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                {slot.state === 'Planned' && (
                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/more/meals/cook/${slot.id}` as any)}
                  >
                    <Ionicons name="play" size={18} color={colors.background} />
                    <Text style={styles.startBtnText}>Ξεκίνα μαγείρεμα</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.changeBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/more/meals/change/${slot.id}` as any)}
                >
                  <Ionicons name="swap-horizontal" size={18} color={colors.category.work} />
                  <Text style={styles.changeBtnText}>Αλλαγή γεύματος</Text>
                </TouchableOpacity>
                {!slot.locked && (
                  <TouchableOpacity
                    style={styles.lockBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      const plan = activePlan;
                      if (!plan) return;
                      void useMealsStore.getState().updateSlot(plan.id, slot.id, { locked: true });
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.lockBtnText}>Κλείδωμα</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>
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
  backBtn: { padding: spacing.xs, marginRight: spacing.s },
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
  scroll: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xxl },
  notFound: { alignItems: 'center', paddingVertical: spacing.xl },
  notFoundText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
    gap: spacing.s,
    ...shadows.small,
  },
  mealName: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.m,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  reasonText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  statusLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lockedText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.s },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    ...shadows.medium,
  },
  startBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    borderWidth: 1,
    borderColor: colors.category.work + '50',
  },
  changeBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockBtnText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
});
