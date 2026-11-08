import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HomeRow } from '../today/HomeRow';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useMealsStore } from '../../store/useMealsStore';

const SLOT_LABELS: Record<string, string> = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Dinner: 'Dinner',
  Snack: 'Snack',
};

export function TodayMealCard() {
  const router = useRouter();
  const { todayCard, todayCardLoading, fetchTodayCard } = useMealsStore();

  useEffect(() => {
    fetchTodayCard();
  }, [fetchTodayCard]);

  if (todayCardLoading || !todayCard) return null;

  const { nextMeal, actionableReminder, hasUnconfirmedIngredients } = todayCard;
  const canStart = nextMeal?.state === 'Planned';
  const cookPath = canStart ? (`/more/meals/cook/${nextMeal.id}` as const) : null;
  const changePath = canStart ? (`/more/meals/change/${nextMeal.id}` as const) : null;

  if (!nextMeal || !canStart) {
    return (
      <HomeRow
        icon="nutrition"
        label="Meals"
        title={actionableReminder ?? 'All meals for today are done'}
        onPress={() => router.push('/more/meals' as any)}
      />
    );
  }

  const slot = SLOT_LABELS[nextMeal.slot] ?? 'Meal';
  const minutes = nextMeal.handsonMinutes ?? nextMeal.totalMinutes;
  const meta = [
    minutes ? `${minutes} min` : null,
    hasUnconfirmedIngredients ? 'Check ingredients' : actionableReminder,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => cookPath && router.push(cookPath as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.label}>{slot}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {nextMeal.recipeName ?? 'Meal'}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primary}
          onPress={() => cookPath && router.push(cookPath as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryText}>Cook</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondary}
          onPress={() => changePath && router.push(changePath as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryText}>Change</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.s,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
  },
  primaryText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.onPrimary,
  },
  secondary: {
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
