import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { useMealsStore } from '../../store/useMealsStore';

export function TodayMealCard() {
  const router = useRouter();
  const { todayCard, todayCardLoading, fetchTodayCard } = useMealsStore();

  useEffect(() => {
    fetchTodayCard();
  }, [fetchTodayCard]);

  if (todayCardLoading || !todayCard) return null;

  const { nextMeal, actionableReminder, hasUnconfirmedIngredients } = todayCard;

  if (!nextMeal) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.category.health + '20', colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.headerRow}>
            <Ionicons name="restaurant-outline" size={18} color={colors.category.health} />
            <Text style={styles.sectionLabel}>ΓΕΥΜΑΤΑ ΣΗΜΕΡΑ</Text>
          </View>
          <Text style={styles.noMealText}>Δεν υπάρχει προγραμματισμένο γεύμα</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/more/meals' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Χρησιμοποίησε αυτά που έχεις</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.push('/more/meals' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnSecondaryText}>Κάτι εύκολο</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/more/meals' as any)}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[colors.category.health + '20', colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <Ionicons name="restaurant-outline" size={18} color={colors.category.health} />
          <Text style={styles.sectionLabel}>ΒΡΑΔΙΝΟ ΣΗΜΕΡΑ</Text>
        </View>

        <Text style={styles.mealName}>{nextMeal.recipeName ?? 'Γεύμα'}</Text>

        <View style={styles.metaRow}>
          {nextMeal.handsonMinutes && (
            <View style={styles.metaItem}>
              <Ionicons name="hand-left-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaText}>{nextMeal.handsonMinutes} λεπτά χειρισμός</Text>
            </View>
          )}
          {nextMeal.totalMinutes && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaText}>{nextMeal.totalMinutes} λεπτά σύνολο</Text>
            </View>
          )}
        </View>

        {actionableReminder && (
          <View style={styles.reminderRow}>
            <Ionicons name="notifications-outline" size={13} color={colors.category.work} />
            <Text style={styles.reminderText}>{actionableReminder}</Text>
          </View>
        )}

        {hasUnconfirmedIngredients && (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.warning} />
            <Text style={styles.warningText}>Έλεγξε τα υλικά πριν ξεκινήσεις</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/more/meals' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={14} color={colors.background} />
            <Text style={styles.actionBtnText}>Ξεκίνα μαγείρεμα</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => router.push('/more/meals' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnSecondaryText}>Αλλαγή</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.category.health + '30',
    overflow: 'hidden',
    ...shadows.small,
  },
  gradient: {
    padding: spacing.m,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.health,
    letterSpacing: 0.5,
  },
  mealName: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  noMealText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.s,
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
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  reminderText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontWeight: typography.fontWeight.semibold,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  warningText: {
    fontSize: typography.fontSize.caption,
    color: colors.warning,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  actionBtnText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnSecondaryText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
