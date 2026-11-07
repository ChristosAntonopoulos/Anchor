import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

const EQUIPMENT_OPTIONS = [
  { id: 'oven', label: 'Φούρνος' },
  { id: 'hob', label: 'Εστία' },
  { id: 'microwave', label: 'Μικροκύματα' },
  { id: 'airfryer', label: 'Air Fryer' },
  { id: 'ricecooker', label: 'Rice Cooker' },
];

const EFFORT_OPTIONS = [
  { id: '10', label: '10 λεπτά' },
  { id: '20', label: '20 λεπτά' },
  { id: '30', label: '30 λεπτά' },
  { id: '45', label: '45 λεπτά' },
];

const LEFTOVER_OPTIONS = [
  { id: 'HappyToRepeat', label: 'Χαίρομαι να επαναλαμβάνω' },
  { id: 'OneRepeat', label: 'Μία επανάληψη' },
  { id: 'PreferFresh', label: 'Προτιμώ φρέσκα' },
];

const EXPLORATION_OPTIONS = [
  { id: 'MostlyFamiliar', label: 'Κυρίως γνωστά' },
  { id: 'Mixed', label: 'Ανάμεικτα' },
  { id: 'Explore', label: 'Εξερεύνηση' },
];

const SHOPPING_DAYS = [
  { id: 'Mon', label: 'Δευ' },
  { id: 'Tue', label: 'Τρι' },
  { id: 'Wed', label: 'Τετ' },
  { id: 'Thu', label: 'Πεμ' },
  { id: 'Fri', label: 'Παρ' },
  { id: 'Sat', label: 'Σαβ' },
  { id: 'Sun', label: 'Κυρ' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { profile, fetchProfile, updateProfile, profileLoading } = useMealsStore();

  const [servings, setServings] = useState(1);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [effortMinutes, setEffortMinutes] = useState<string[]>([]);
  const [leftoverPref, setLeftoverPref] = useState<string[]>([]);
  const [exploration, setExploration] = useState<string[]>(['MostlyFamiliar']);
  const [shoppingDays, setShoppingDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [fetchProfile, profile]);

  useEffect(() => {
    if (profile) {
      setServings(profile.defaultServings);
      setEquipment(profile.availableEquipment);
      setEffortMinutes(
        profile.typicalWeekdayHandsOnMinutes
          ? [String(profile.typicalWeekdayHandsOnMinutes)]
          : []
      );
      setLeftoverPref(
        profile.leftoverPreference !== 'Unknown' ? [profile.leftoverPreference] : []
      );
      setExploration([profile.explorationLevel]);
      setShoppingDays(profile.preferredShoppingDays);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        defaultServings: servings,
        availableEquipment: equipment,
        typicalWeekdayHandsOnMinutes: effortMinutes[0] ? parseInt(effortMinutes[0]) : undefined,
        leftoverPreference: leftoverPref[0] ?? 'Unknown',
        explorationLevel: exploration[0] ?? 'MostlyFamiliar',
        preferredShoppingDays: shoppingDays,
        setupComplete: true,
        expectedVersion: profile?.version ?? 0,
      });
      router.back();
    } catch (e) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading && !profile) {
    return (
      <LinearGradient colors={gradients.background.colors} style={styles.flex}>
        <SafeAreaView style={[styles.flex, styles.center]}>
          <ActivityIndicator size="large" color={colors.category.health} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.background.colors} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Προτιμήσεις Γεύματος</Text>
        </View>
        <Text style={styles.subtitle}>Κάν' το πιο εύκολο για σένα · Μπορείς να αλλάξεις οτιδήποτε αργότερα</Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Για ποιους μαγειρεύω;</Text>

            <StepperField
              label="Μερίδες"
              value={servings}
              onDecrement={() => setServings(Math.max(1, servings - 1))}
              onIncrement={() => setServings(Math.min(10, servings + 1))}
              min={1}
              max={10}
              unit="άτομα"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Χρόνος μαγειρέματος</Text>
            <ChipSelector
              label="Τυπικός χρόνος χειρισμού (Δευτ–Παρ)"
              options={EFFORT_OPTIONS}
              selected={effortMinutes}
              onToggle={(id) => setEffortMinutes([id])}
              multiSelect={false}
              hint="Χρόνος που είσαι ενεργά στην κουζίνα, όχι συνολικός"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Εξοπλισμός κουζίνας</Text>
            <ChipSelector
              label="Διαθέσιμος εξοπλισμός"
              options={EQUIPMENT_OPTIONS}
              selected={equipment}
              onToggle={(id) =>
                setEquipment((prev) =>
                  prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
                )
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Υπολείμματα &amp; ποικιλία</Text>
            <ChipSelector
              label="Υπολείμματα"
              options={LEFTOVER_OPTIONS}
              selected={leftoverPref}
              onToggle={(id) => setLeftoverPref([id])}
              multiSelect={false}
            />
            <ChipSelector
              label="Εξερεύνηση συνταγών"
              options={EXPLORATION_OPTIONS}
              selected={exploration}
              onToggle={(id) => setExploration([id])}
              multiSelect={false}
              hint="Προεπιλογή: Κυρίως γνωστά"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ψώνια</Text>
            <ChipSelector
              label="Προτιμώμενες μέρες αγορών"
              options={SHOPPING_DAYS}
              selected={shoppingDays}
              onToggle={(id) =>
                setShoppingDays((prev) =>
                  prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
                )
              }
              optional
              horizontal
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.noteText}>
              Αλλεργίες &amp; αποφυγές: Θα σε ρωτήσω όταν χρειαστεί. Δεν θα υποθέσω ποτέ ότι δεν υπάρχουν.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.saveBtnText}>Αποθήκευση προτιμήσεων</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Συνέχεια χωρίς ολοκλήρωση</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.s },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
    marginBottom: spacing.m,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.caption,
  },
  actions: { gap: spacing.m },
  saveBtn: {
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    alignItems: 'center',
    ...shadows.medium,
  },
  saveBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  skipBtn: {
    paddingVertical: spacing.s,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
