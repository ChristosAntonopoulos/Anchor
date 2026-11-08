import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { ChipSelector } from '../../../components/meals/shared/ChipSelector';
import { StepperField } from '../../../components/meals/shared/StepperField';

type Stage = 'week' | 'wishes' | 'review';

const SLOT_OPTIONS = [
  { id: 'Breakfast', label: 'Breakfast' },
  { id: 'Lunch', label: 'Lunch' },
  { id: 'Dinner', label: 'Dinner' },
  { id: 'Snack', label: 'Snack' },
];

const DAY_OPTIONS = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
  { id: 'Sun', label: 'Sun' },
];

const DAYS_COUNT_OPTIONS = [
  { id: '3', label: '3 days' },
  { id: '5', label: '5 days' },
  { id: '7', label: '7 days' },
];

function getWeekDates(daysCount: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: string[] = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function PlanScreen() {
  const router = useRouter();
  const { createPlan, activatePlan, generateShoppingTrip } = useMealsStore();

  const [stage, setStage] = useState<Stage>('week');
  const [daysCount, setDaysCount] = useState<string[]>(['7']);
  const [servings, setServings] = useState(1);
  const [slots, setSlots] = useState<string[]>(['Dinner']);
  const [noCookDays, setNoCookDays] = useState<string[]>([]);
  const [wishes, setWishes] = useState('');
  const [creating, setCreating] = useState(false);

  const handleNext = () => {
    if (stage === 'week') setStage('wishes');
    else if (stage === 'wishes') setStage('review');
  };

  const handleBack = () => {
    if (stage === 'review') setStage('wishes');
    else if (stage === 'wishes') setStage('week');
    else router.back();
  };

  const handleSavePlan = async () => {
    setCreating(true);
    try {
      const count = parseInt(daysCount[0] ?? '7');
      const dates = getWeekDates(count);
      const dayAbbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const planSlots = dates.flatMap((date) => {
        const dayAbbr = dayAbbrs[new Date(date + 'T00:00:00').getDay()];
        const isNoCook = noCookDays.includes(dayAbbr);

        return slots.map((slotKind) => ({
          localDate: date,
          slot: slotKind,
          kind: isNoCook ? 'NoCook' : 'FreshCook',
          servings,
          locked: false,
          reasonSummary: isNoCook ? 'No cook' : undefined,
        }));
      });

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + count - 1);

      const plan = await createPlan({
        weekStartDate: start.toISOString(),
        weekEndDate: end.toISOString(),
        slots: planSlots,
      });

      await activatePlan(plan.id);
      await generateShoppingTrip(plan.id);

      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not create the plan. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const StageIndicator = () => (
    <View style={styles.stageRow}>
      {(['week', 'wishes', 'review'] as Stage[]).map((s, i) => (
        <React.Fragment key={s}>
          <View style={[styles.stageDot, stage === s && styles.stageDotActive]} />
          {i < 2 && <View style={[styles.stageLine, i < ['week', 'wishes', 'review'].indexOf(stage) && styles.stageLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <LinearGradient colors={gradients.background.colors} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Week plan</Text>
            <Text style={styles.headerSub}>
              {stage === 'week' ? 'Step 1: My week' :
               stage === 'wishes' ? 'Step 2: Wishes' :
               'Step 3: Review'}
            </Text>
          </View>
        </View>

        <StageIndicator />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {stage === 'week' && (
            <>
              <ChipSelector
                label="Number of days"
                options={DAYS_COUNT_OPTIONS}
                selected={daysCount}
                onToggle={(id) => setDaysCount([id])}
                multiSelect={false}
              />
              <ChipSelector
                label="Meals to plan"
                options={SLOT_OPTIONS}
                selected={slots}
                onToggle={(id) =>
                  setSlots((prev) =>
                    prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
                  )
                }
              />
              <StepperField
                label="Servings"
                value={servings}
                onDecrement={() => setServings(Math.max(1, servings - 1))}
                onIncrement={() => setServings(Math.min(10, servings + 1))}
                min={1}
                max={10}
                unit="people"
              />
              <ChipSelector
                label="No-cook days"
                options={DAY_OPTIONS}
                selected={noCookDays}
                onToggle={(id) =>
                  setNoCookDays((prev) =>
                    prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
                  )
                }
                optional
                horizontal
                hint="These days will use leftovers or a no-cook option"
              />
            </>
          )}

          {stage === 'wishes' && (
            <>
              <Text style={styles.wishesPrompt}>What do you want this week?</Text>
              <TextInput
                style={styles.wishesInput}
                value={wishes}
                onChangeText={setWishes}
                placeholder="e.g. Chicken twice, something with lentils, easy lunches, no cook Thursday"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
              <View style={styles.note}>
                <Ionicons name="sparkles" size={16} color={colors.category.work} />
                <Text style={styles.noteText}>
                  Say it in your words — I will turn it into specific meals
                </Text>
              </View>
              <View style={styles.note}>
                <Ionicons name="nutrition-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.noteText}>
                  Food already in the house is used automatically
                </Text>
              </View>
            </>
          )}

          {stage === 'review' && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Plan summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Length</Text>
                  <Text style={styles.summaryValue}>{daysCount[0]} days</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Meals</Text>
                  <Text style={styles.summaryValue}>{slots.map(s => s === 'Dinner' ? 'Dinner' : s === 'Lunch' ? 'Lunch' : s === 'Breakfast' ? 'Breakfast' : 'Snack').join(', ')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Servings</Text>
                  <Text style={styles.summaryValue}>{servings} people</Text>
                </View>
                {noCookDays.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>No cook</Text>
                    <Text style={styles.summaryValue}>{noCookDays.join(', ')}</Text>
                  </View>
                )}
                {wishes.trim() && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Wishes</Text>
                    <Text style={styles.summaryValue}>{wishes.trim()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.note}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.noteText}>
                  Save the plan and build the shopping list
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {stage !== 'review' ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>
                {stage === 'week' ? 'Next: Wishes →' : 'Next: Review →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveBtn, creating && styles.saveBtnDisabled]}
              onPress={handleSavePlan}
              disabled={creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                  <Text style={styles.saveBtnText}>Save plan</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    gap: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  stageDotActive: {
    backgroundColor: colors.category.health,
  },
  stageLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.border,
  },
  stageLineActive: {
    backgroundColor: colors.category.health,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xxl },
  wishesPrompt: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  wishesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.m,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.caption,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
    gap: spacing.s,
    ...shadows.small,
  },
  summaryTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.m,
  },
  summaryLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'right',
    flex: 1,
  },
  footer: {
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBtn: {
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    alignItems: 'center',
    ...shadows.medium,
  },
  nextBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    ...shadows.medium,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
});
