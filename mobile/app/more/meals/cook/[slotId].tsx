import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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
import { useCookingStore } from '../../../../store/useCookingStore';
import type { CookReady, RecipeStep } from '../../../../types/meals';

function formatRemain(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function canStart(step: RecipeStep, done: Set<number>) {
  const deps = step.dependsOnSteps ?? [];
  return deps.every((d) => done.has(d));
}

export default function CookSessionScreen() {
  const { slotId } = useLocalSearchParams<{ slotId: string }>();
  const router = useRouter();
  const { fetchActivePlan, cookReady, completeCook } = useMealsStore();
  const timers = useCookingStore((s) => s.timers);
  const startTimer = useCookingStore((s) => s.startTimer);
  const markStepDone = useCookingStore((s) => s.markStepDone);
  const isStepDone = useCookingStore((s) => s.isStepDone);
  const tick = useCookingStore((s) => s.tick);
  const clearSlot = useCookingStore((s) => s.clearSlot);

  const [ready, setReady] = useState<CookReady | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    if (!slotId) return;
    setLoading(true);
    setError(null);
    try {
      let plan = useMealsStore.getState().activePlan;
      if (!plan) {
        await fetchActivePlan();
        plan = useMealsStore.getState().activePlan;
      }
      if (!plan) throw new Error('No active plan');
      const data = await cookReady(plan.id, slotId);
      setReady(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [slotId, fetchActivePlan, cookReady]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const recipe = ready?.recipe;
  const slotTimers = useMemo(
    () => timers.filter((t) => t.slotId === slotId),
    [timers, slotId]
  );
  const otherTimers = useMemo(
    () => timers.filter((t) => t.slotId !== slotId && t.status === 'running'),
    [timers, slotId]
  );

  const doneSet = useMemo(() => {
    const set = new Set<number>();
    recipe?.steps.forEach((s) => {
      if (isStepDone(slotId, s.stepNumber)) set.add(s.stepNumber);
    });
    return set;
  }, [recipe, slotId, isStepDone, timers]);

  const allDone = recipe ? recipe.steps.every((s) => doneSet.has(s.stepNumber)) : false;

  const onStartTimer = async (step: RecipeStep) => {
    if (!ready) return;
    await startTimer({
      slotId: ready.slot.id,
      planId: ready.planId,
      recipeName: ready.recipe.nameEn || recipe.nameEl,
      stepNumber: step.stepNumber,
      action: step.action,
      durationMinutes: step.durationMinutes || 1,
    });
  };

  const onFinish = async () => {
    if (!ready) return;
    setFinishing(true);
    try {
      await completeCook(ready.slot.id, ready.recipe.id);
      clearSlot(ready.slot.id);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to finish');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <LinearGradient colors={gradients.background.colors} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Cooking</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {(recipe?.nameEn || recipe?.nameEl) ?? 'Loading recipe'}
            </Text>
          </View>
        </View>

        {otherTimers.length > 0 && (
          <View style={styles.otherBar}>
            <Ionicons name="layers-outline" size={16} color={colors.category.work} />
            <Text style={styles.otherText} numberOfLines={1}>
              Also running: {otherTimers.map((t) => `${t.recipeName} ${formatRemain(t.endsAt - Date.now())}`).join(' · ')}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.category.health} />
            <Text style={styles.loadingText}>Preparing steps and times…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={() => void load()}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : recipe ? (
          <ScrollView contentContainerStyle={styles.content}>
            {slotTimers.filter((t) => t.status === 'running').length > 0 && (
              <View style={styles.liveTimers}>
                {slotTimers
                  .filter((t) => t.status === 'running')
                  .map((t) => (
                    <View key={t.id} style={styles.liveChip}>
                      <Text style={styles.liveTime}>{formatRemain(t.endsAt - Date.now())}</Text>
                      <Text style={styles.liveAction} numberOfLines={2}>
                        {t.action}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.section}>Ingredients · {recipe.yieldServings} servings</Text>
              {recipe.ingredients.map((ing, i) => (
                <Text key={`${ing.rawName}-${i}`} style={styles.ingredient}>
                  {ing.amount ? `${ing.amount} ${ing.unit ?? ''} `.trim() + ' ' : ''}
                  {ing.rawName}
                  {ing.isOptional ? ' (optional)' : ''}
                </Text>
              ))}
            </View>

            <Text style={styles.section}>Steps</Text>
            {recipe.steps
              .slice()
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step) => {
                const timer = slotTimers.find((t) => t.stepNumber === step.stepNumber);
                const done = doneSet.has(step.stepNumber);
                const blocked = !canStart(step, doneSet);
                const isTimer = (step.durationMinutes ?? 0) > 0;
                const ringing = timer?.status === 'done' && !done;

                return (
                  <View
                    key={step.stepNumber}
                    style={[
                      styles.step,
                      done && styles.stepDone,
                      ringing && styles.stepRing,
                      timer?.status === 'running' && styles.stepRunning,
                    ]}
                  >
                    <View style={styles.stepHead}>
                      <View style={[styles.num, done && styles.numDone]}>
                        <Text style={styles.numText}>{done ? '✓' : step.stepNumber}</Text>
                      </View>
                      <View style={styles.stepBody}>
                        <Text style={styles.stepAction}>{step.action}</Text>
                        <View style={styles.stepMeta}>
                          {isTimer && (
                            <Text style={styles.meta}>
                              {step.isActive ? 'Timer' : 'Hands-on'} · {step.durationMinutes} min
                            </Text>
                          )}
                          {(step.dependsOnSteps?.length ?? 0) > 0 && (
                            <Text style={styles.meta}>after {step.dependsOnSteps.join(', ')}</Text>
                          )}
                        </View>
                        {timer?.status === 'running' && (
                          <Text style={styles.countdown}>{formatRemain(timer.endsAt - Date.now())}</Text>
                        )}
                        {ringing && <Text style={styles.readyLabel}>Ready — it rang</Text>}
                      </View>
                    </View>
                    {!done && (
                      <View style={styles.stepActions}>
                        {isTimer && timer?.status !== 'running' && (
                          <TouchableOpacity
                            style={[styles.smallBtn, blocked && styles.btnDisabled]}
                            disabled={blocked}
                            onPress={() => void onStartTimer(step)}
                          >
                            <Ionicons name="play" size={14} color={colors.background} />
                            <Text style={styles.smallBtnText}>
                              {timer?.status === 'done' ? 'Again' : 'Start timer'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.smallBtnGhost, blocked && styles.btnDisabled]}
                          disabled={blocked}
                          onPress={() => markStepDone(slotId, step.stepNumber)}
                        >
                          <Text style={styles.smallBtnGhostText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

            <TouchableOpacity
              style={[styles.finishBtn, !allDone && styles.finishMuted]}
              onPress={() => void onFinish()}
              disabled={finishing}
            >
              {finishing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                  <Text style={styles.finishText}>
                    {allDone ? 'Finish cooking' : 'Finish without every step'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : null}
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
  headerSub: { fontSize: typography.fontSize.caption, color: colors.textSecondary },
  otherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  otherText: { flex: 1, fontSize: 12, color: colors.category.work },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.m, padding: spacing.l },
  loadingText: { color: colors.textSecondary },
  errorText: { color: colors.warning, textAlign: 'center' },
  retry: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: { color: colors.textPrimary, fontWeight: typography.fontWeight.semibold },
  content: { padding: spacing.m, paddingBottom: spacing.xxl, gap: spacing.s },
  liveTimers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.s },
  liveChip: {
    backgroundColor: colors.category.health + '22',
    borderColor: colors.category.health,
    borderWidth: 1,
    borderRadius: borderRadius.large,
    padding: spacing.s,
    minWidth: 140,
    flexGrow: 1,
  },
  liveTime: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.health,
    fontVariant: ['tabular-nums'],
  },
  liveAction: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    gap: 4,
    ...shadows.small,
  },
  section: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.health,
    letterSpacing: 0.4,
    marginTop: spacing.s,
  },
  ingredient: { fontSize: typography.fontSize.body, color: colors.textPrimary },
  step: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    gap: spacing.s,
  },
  stepDone: { opacity: 0.55 },
  stepRunning: { borderColor: colors.category.health },
  stepRing: { borderColor: colors.warning, backgroundColor: colors.warning + '18' },
  stepHead: { flexDirection: 'row', gap: spacing.s },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.category.health + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numDone: { backgroundColor: colors.category.leverage + '55' },
  numText: { color: colors.textPrimary, fontWeight: typography.fontWeight.bold },
  stepBody: { flex: 1, gap: 4 },
  stepAction: { fontSize: typography.fontSize.body, color: colors.textPrimary, fontWeight: typography.fontWeight.semibold },
  stepMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  meta: { fontSize: 12, color: colors.textSecondary },
  countdown: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.health,
    fontVariant: ['tabular-nums'],
  },
  readyLabel: { color: colors.warning, fontWeight: typography.fontWeight.bold },
  stepActions: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap' },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  smallBtnText: { color: colors.background, fontWeight: typography.fontWeight.bold, fontSize: 13 },
  smallBtnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  smallBtnGhostText: { color: colors.textSecondary, fontWeight: typography.fontWeight.semibold, fontSize: 13 },
  btnDisabled: { opacity: 0.4 },
  finishBtn: {
    marginTop: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    ...shadows.medium,
  },
  finishMuted: { backgroundColor: colors.surfaceHover },
  finishText: { color: colors.background, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.body },
});
