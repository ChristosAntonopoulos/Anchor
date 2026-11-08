import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { useMealsStore } from '../../store/useMealsStore';
import type { InventoryBatch } from '../../types/meals';

const LOCATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Fridge: 'snow-outline',
  Freezer: 'cube-outline',
  Cupboard: 'archive-outline',
};

const DATE_TYPE_LABELS: Record<string, string> = {
  UseBy: 'Use by',
  BestBefore: 'Best before',
  NoPrintedDate: 'No printed date',
  Unknown: 'Date unknown',
};

function BatchCard({ batch, onDiscard }: { batch: InventoryBatch; onDiscard: (id: string) => void }) {
  const isUseSoon = batch.dateType === 'UseBy' && batch.printedDate
    ? (new Date(batch.printedDate).getTime() - Date.now()) / 86400000 <= 3
    : false;

  const dateLabel = batch.printedDate
    ? `${DATE_TYPE_LABELS[batch.dateType] ?? batch.dateType}: ${new Date(batch.printedDate).toLocaleDateString('en-GB')}`
    : DATE_TYPE_LABELS[batch.dateType] ?? '';

  return (
    <View style={[styles.batchCard, isUseSoon && styles.batchCardUseSoon]}>
      <View style={styles.batchMain}>
        <View style={styles.batchLeft}>
          <Text style={styles.batchName}>{batch.rawName}</Text>
          <Text style={styles.batchAmount}>
            {batch.amountIsApproximate ? '~' : ''}
            {batch.currentAmount} {batch.unit}
            {batch.form !== 'raw' && ` (${batch.form})`}
          </Text>
          {dateLabel ? (
            <Text style={[styles.batchDate, isUseSoon && styles.batchDateUrgent]}>
              {isUseSoon && '⚠ '}
              {dateLabel}
            </Text>
          ) : null}
          {batch.openedAt && (
            <Text style={styles.batchOpened}>
              Opened: {new Date(batch.openedAt).toLocaleDateString('en-GB')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.discardBtn}
          onPress={() => onDiscard(batch.id)}
          accessibilityLabel={`Discard ${batch.rawName}`}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LocationSection({
  title,
  icon,
  batches,
  onDiscard,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  batches: InventoryBatch[];
  onDiscard: (id: string) => void;
}) {
  if (batches.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{batches.length}</Text>
      </View>
      {batches.map((b) => (
        <BatchCard key={b.id} batch={b} onDiscard={onDiscard} />
      ))}
    </View>
  );
}

export function PantryView() {
  const router = useRouter();
  const { inventory, inventoryLoading, fetchInventory, discardBatch } = useMealsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const handleDiscard = (id: string) => {
    Alert.alert(
      'Discard food',
      'Remove this from the pantry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => discardBatch(id),
        },
      ]
    );
  };

  if (inventoryLoading && !inventory) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.category.health} />
      </View>
    );
  }

  const useSoon = inventory?.useSoon ?? [];
  const hasAnyItems =
    (inventory?.fridge.length ?? 0) +
    (inventory?.freezer.length ?? 0) +
    (inventory?.cupboard.length ?? 0) > 0;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.health} />
        }
      >
        {useSoon.length > 0 && (
          <View style={[styles.section, styles.useSoonSection]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={18} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.warning }]}>Use soon</Text>
              <Text style={styles.sectionCount}>{useSoon.length}</Text>
            </View>
            {useSoon.map((b) => (
              <BatchCard key={b.id} batch={b} onDiscard={handleDiscard} />
            ))}
          </View>
        )}

        <LocationSection
          title="Fridge"
          icon="snow-outline"
          batches={inventory?.fridge ?? []}
          onDiscard={handleDiscard}
        />
        <LocationSection
          title="Freezer"
          icon="cube-outline"
          batches={inventory?.freezer ?? []}
          onDiscard={handleDiscard}
        />
        <LocationSection
          title="Cupboard"
          icon="archive-outline"
          batches={inventory?.cupboard ?? []}
          onDiscard={handleDiscard}
        />

        {!hasAnyItems && (
          <View style={styles.emptyContent}>
            <Ionicons name="nutrition-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Nothing in the pantry</Text>
            <Text style={styles.emptyText}>
              You do not need a perfect pantry to start planning
            </Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Floating add button */}
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => router.push('/more/meals/add-item' as any)}
        activeOpacity={0.85}
        accessibilityLabel="Add food"
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xxl + 80 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
    overflow: 'hidden',
    ...shadows.small,
  },
  useSoonSection: {
    borderColor: colors.warning + '50',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
  },
  batchCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  batchCardUseSoon: {
    backgroundColor: colors.warning + '08',
  },
  batchMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.m,
  },
  batchLeft: { flex: 1 },
  batchName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  batchAmount: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  batchDate: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  batchDateUrgent: {
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
  },
  batchOpened: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  discardBtn: {
    padding: spacing.s,
    marginLeft: spacing.s,
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.xl,
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
    maxWidth: 280,
  },
  bottomPad: { height: 20 },
  addFab: {
    position: 'absolute',
    bottom: spacing.l,
    right: spacing.l,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.category.health,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.category.health,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
