import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import {
  WATER_TARGET_GLASSES,
  findWaterItem,
  waterLitres,
} from '../../utils/waterReminders';
import type { DisciplineEntry } from '../../types';

interface HydrationCardProps {
  discipline: DisciplineEntry;
  onAddGlass: (blockId: string, itemId: string) => void;
}

export function HydrationCard({ discipline, onAddGlass }: HydrationCardProps) {
  const water = findWaterItem(discipline);
  const glasses = water?.glasses ?? 0;
  const target = WATER_TARGET_GLASSES;
  const progress = Math.min(1, glasses / target);
  const done = glasses >= target;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppIcon name="water" size={18} color={colors.primary} />
        <Text style={styles.label}>Water</Text>
        <Text style={styles.count}>
          {glasses}/{target} · {waterLitres(glasses)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.hint}>
        {done
          ? '2.5 L of drinks is the day’s target. Extra is fine in heat or after training.'
          : 'Sip 250 ml now. 2.5 L of drinks today — food covers the rest. Pale yellow urine is the check.'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (water) onAddGlass(water.blockId, water.itemId);
        }}
        disabled={!water}
        accessibilityRole="button"
        accessibilityLabel="Log a 250 millilitre glass of water"
      >
        <Text style={styles.buttonText}>+ 250 ml</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  label: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryContainer,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.caption,
  },
});
