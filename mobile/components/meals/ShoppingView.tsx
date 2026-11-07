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
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { useMealsStore } from '../../store/useMealsStore';
import type { MealPlan, ShoppingLine } from '../../types/meals';

interface ShoppingViewProps {
  plan: MealPlan | null;
}

function ShoppingLineItem({
  line,
  tripId,
  onToggle,
}: {
  line: ShoppingLine;
  tripId: string;
  onToggle: (lineId: string, checked: boolean) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.lineItem, line.isChecked && styles.lineItemChecked]}
      onPress={() => onToggle(line.id, !line.isChecked)}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: line.isChecked }}
    >
      <View style={[styles.checkbox, line.isChecked && styles.checkboxChecked]}>
        {line.isChecked && <Ionicons name="checkmark" size={14} color={colors.background} />}
      </View>
      <View style={styles.lineContent}>
        <View style={styles.lineHeader}>
          <Text style={[styles.lineName, line.isChecked && styles.lineNameChecked]}>
            {line.rawName}
          </Text>
          {line.isCheckAtHome && (
            <View style={styles.checkAtHomeBadge}>
              <Text style={styles.checkAtHomeBadgeText}>Έλεγξε στο σπίτι</Text>
            </View>
          )}
        </View>
        <Text style={styles.lineAmount}>
          {line.requiredAmount} {line.unit}
          {line.suggestedPackSize ? ` · ${line.suggestedPackSize}` : ''}
        </Text>
        {line.whyNeeded && (
          <Text style={styles.lineWhy}>{line.whyNeeded}</Text>
        )}
        {line.estimatedPriceEur ? (
          <Text style={styles.linePrice}>~€{line.estimatedPriceEur.toFixed(2)}</Text>
        ) : (
          <Text style={styles.linePriceUnknown}>Τιμή άγνωστη</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function ShoppingView({ plan }: ShoppingViewProps) {
  const { shoppingTrip, shoppingLoading, fetchShoppingTrip, generateShoppingTrip, checkShoppingLine, finishShopping } =
    useMealsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (plan?.id) {
      fetchShoppingTrip(plan.id);
    }
  }, [plan?.id, fetchShoppingTrip]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (plan?.id) await fetchShoppingTrip(plan.id);
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    if (!plan) return;
    await generateShoppingTrip(plan.id);
  };

  const handleFinish = async () => {
    if (!shoppingTrip) return;
    Alert.alert(
      'Ολοκλήρωση ψωνιών',
      'Τα αγορασμένα προϊόντα θα προστεθούν στην αποθήκη σου.',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Ολοκλήρωση',
          onPress: async () => {
            setFinishing(true);
            try {
              await finishShopping(shoppingTrip.id);
            } finally {
              setFinishing(false);
            }
          },
        },
      ]
    );
  };

  if (!plan) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={48} color={colors.border} />
        <Text style={styles.emptyTitle}>Δεν υπάρχει πλάνο</Text>
        <Text style={styles.emptyText}>Δημιούργησε πρώτα ένα εβδομαδιαίο πλάνο</Text>
      </View>
    );
  }

  if (shoppingLoading && !shoppingTrip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.category.health} />
      </View>
    );
  }

  if (!shoppingTrip) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={48} color={colors.border} />
        <Text style={styles.emptyTitle}>Δεν υπάρχει λίστα αγορών</Text>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={colors.background} />
          <Text style={styles.generateBtnText}>Δημιούργησε λίστα</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const checkedCount = shoppingTrip.lines.filter((l) => l.isChecked).length;
  const totalCount = shoppingTrip.lines.length;
  const buyLines = shoppingTrip.lines.filter((l) => !l.isCheckAtHome);
  const checkHomeLines = shoppingTrip.lines.filter((l) => l.isCheckAtHome);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.health} />
        }
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryProgress}>
            {checkedCount}/{totalCount} αντικείμενα
          </Text>
          {shoppingTrip.confirmedPriceTotal ? (
            <Text style={styles.summaryPrice}>
              ~€{shoppingTrip.confirmedPriceTotal.toFixed(2)}
              {shoppingTrip.unpricedItems > 0 ? ` + ${shoppingTrip.unpricedItems} χωρίς τιμή` : ''}
            </Text>
          ) : (
            <Text style={styles.summaryPriceUnknown}>
              {shoppingTrip.unpricedItems} αντικείμενα χωρίς τιμή
            </Text>
          )}
        </View>

        {/* Buy lines */}
        {buyLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Αγορά</Text>
            {buyLines.map((line) => (
              <ShoppingLineItem
                key={line.id}
                line={line}
                tripId={shoppingTrip.id}
                onToggle={checkShoppingLine}
              />
            ))}
          </View>
        )}

        {/* Check at home */}
        {checkHomeLines.length > 0 && (
          <View style={[styles.section, styles.sectionCheckHome]}>
            <Text style={styles.sectionTitle}>Έλεγξε στο σπίτι</Text>
            {checkHomeLines.map((line) => (
              <ShoppingLineItem
                key={line.id}
                line={line}
                tripId={shoppingTrip.id}
                onToggle={checkShoppingLine}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {shoppingTrip.status !== 'Completed' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.finishBtn, finishing && styles.finishBtnDisabled]}
            onPress={handleFinish}
            disabled={finishing}
            activeOpacity={0.8}
          >
            {finishing ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                <Text style={styles.finishBtnText}>Ολοκλήρωση ψωνιών</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    padding: spacing.xl,
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
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    ...shadows.medium,
  },
  generateBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xxl + 80 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.small,
  },
  summaryProgress: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  summaryPrice: {
    fontSize: typography.fontSize.caption,
    color: colors.category.leverage,
    fontWeight: typography.fontWeight.semibold,
  },
  summaryPriceUnknown: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.m,
    overflow: 'hidden',
    ...shadows.small,
  },
  sectionCheckHome: {
    borderColor: colors.category.work + '40',
  },
  sectionTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.m,
    gap: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineItemChecked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.category.health,
    borderColor: colors.category.health,
  },
  lineContent: { flex: 1 },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  lineName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  lineNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  checkAtHomeBadge: {
    backgroundColor: colors.category.work + '20',
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  checkAtHomeBadgeText: {
    fontSize: 10,
    color: colors.category.work,
    fontWeight: typography.fontWeight.semibold,
  },
  lineAmount: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  lineWhy: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  linePrice: {
    fontSize: typography.fontSize.caption,
    color: colors.category.leverage,
  },
  linePriceUnknown: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  bottomPad: { height: 20 },
  footer: {
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    ...shadows.medium,
  },
  finishBtnDisabled: {
    opacity: 0.6,
  },
  finishBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
});
