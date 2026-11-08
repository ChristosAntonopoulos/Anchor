import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
import type { RecipeVersion } from '../../../../types/meals';

export default function ChangeMealScreen() {
  const { slotId } = useLocalSearchParams<{ slotId: string }>();
  const router = useRouter();
  const {
    activePlan,
    fetchActivePlan,
    getAlternatives,
    generateRecipe,
    updateSlot,
  } = useMealsStore();

  const [recipes, setRecipes] = useState<RecipeVersion[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slot = activePlan?.slots.find((s) => s.id === slotId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!useMealsStore.getState().activePlan) await fetchActivePlan();
      const current = useMealsStore.getState().activePlan?.slots.find((s) => s.id === slotId);
      const list = await getAlternatives(current?.recipeVersionId);
      setRecipes(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetchActivePlan, getAlternatives, slotId]);

  useEffect(() => {
    void load();
  }, [load]);

  const apply = async (recipe: RecipeVersion) => {
    const plan = useMealsStore.getState().activePlan;
    if (!plan || !slotId) return;
    setBusy(true);
    setError(null);
    try {
      await updateSlot(plan.id, slotId, {
        recipeVersionId: recipe.id,
        recipeName: recipe.nameEn || recipe.nameEl,
        kind: 'FreshCook',
        state: 'Planned',
        handsonMinutes: recipe.handsonMinutes,
        totalMinutes: recipe.totalMinutes,
      });
      router.replace(`/more/meals/cook/${slotId}` as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change');
    } finally {
      setBusy(false);
    }
  };

  const onGenerate = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const recipe = await generateRecipe(query.trim(), slot?.servings ?? 2);
      await apply(recipe);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
      setBusy(false);
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
            <Text style={styles.headerTitle}>Change meal</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              Now: {slot?.recipeName || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. lemon chicken"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void onGenerate()}
          />
          <TouchableOpacity style={styles.genBtn} onPress={() => void onGenerate()} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Ionicons name="sparkles" size={18} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Write what you want. The recipe fills in with steps and times.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.category.health} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.card}
                onPress={() => void apply(recipe)}
                disabled={busy}
                activeOpacity={0.8}
              >
                <Text style={styles.name}>{recipe.nameEn || recipe.nameEl}</Text>
                <Text style={styles.meta}>
                  {recipe.steps.length} steps
                  {recipe.handsonMinutes ? ` · ${recipe.handsonMinutes} min hands-on` : ''}
                  {recipe.totalMinutes ? ` · ${recipe.totalMinutes} min total` : ''}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {recipe.steps.map((s) => s.action).join(' → ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
  searchRow: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    color: colors.textPrimary,
  },
  genBtn: {
    width: 48,
    borderRadius: borderRadius.large,
    backgroundColor: colors.category.health,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    fontSize: 12,
    color: colors.textSecondary,
  },
  error: { color: colors.warning, paddingHorizontal: spacing.m, paddingTop: spacing.s },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.m, gap: spacing.s, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    gap: 4,
    ...shadows.small,
  },
  name: { fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary },
  preview: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
