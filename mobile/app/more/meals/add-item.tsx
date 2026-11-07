import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
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

const LOCATION_OPTIONS = [
  { id: 'Fridge', label: 'Ψυγείο' },
  { id: 'Freezer', label: 'Καταψύκτης' },
  { id: 'Cupboard', label: 'Ντουλάπι' },
];

const DATE_TYPE_OPTIONS = [
  { id: 'UseBy', label: 'Ανάλωση έως' },
  { id: 'BestBefore', label: 'Βέλτιστη ποιότητα έως' },
  { id: 'NoPrintedDate', label: 'Χωρίς ημερομηνία' },
  { id: 'Unknown', label: 'Δεν ξέρω' },
];

const UNIT_OPTIONS = [
  { id: 'g', label: 'γρ' },
  { id: 'kg', label: 'κιλά' },
  { id: 'ml', label: 'ml' },
  { id: 'L', label: 'L' },
  { id: 'pieces', label: 'τεμ.' },
  { id: 'portions', label: 'μερίδες' },
];

export default function AddItemScreen() {
  const router = useRouter();
  const { addBatch } = useMealsStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<string[]>(['g']);
  const [isApproximate, setIsApproximate] = useState(false);
  const [location, setLocation] = useState<string[]>(['Fridge']);
  const [dateType, setDateType] = useState<string[]>(['Unknown']);
  const [printedDateText, setPrintedDateText] = useState('');
  const [isOpened, setIsOpened] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && (parseFloat(amount) > 0 || isApproximate);

  const handleSave = async (addMore = false) => {
    if (!canSave) return;
    setSaving(true);
    try {
      await addBatch({
        rawName: name.trim(),
        amount: parseFloat(amount) || 0,
        unit: unit[0] ?? 'g',
        amountIsApproximate: isApproximate,
        location: location[0] ?? 'Fridge',
        dateType: dateType[0] ?? 'Unknown',
        printedDateText: printedDateText.trim() || undefined,
        isOpened,
        notes: notes.trim() || undefined,
      });

      if (addMore) {
        setName('');
        setAmount('');
        setPrintedDateText('');
        setIsOpened(false);
        setNotes('');
      } else {
        router.back();
      }
    } catch {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αποθήκευση. Δοκίμασε ξανά.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={gradients.background.colors} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Προσθήκη τροφίμου</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>ΠΡΟΪΟΝ *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="π.χ. Κοτόπουλο στήθος, Γιαούρτι, Σπανάκι"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.fieldLabel}>ΠΟΣΟΤΗΤΑ</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.textInput, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <ChipSelector
                label=""
                options={UNIT_OPTIONS}
                selected={unit}
                onToggle={(id) => setUnit([id])}
                multiSelect={false}
                horizontal
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Κατά προσέγγιση ποσότητα</Text>
              <Switch
                value={isApproximate}
                onValueChange={setIsApproximate}
                trackColor={{ false: colors.border, true: colors.category.health + '60' }}
                thumbColor={isApproximate ? colors.category.health : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ChipSelector
              label="ΑΠΟΘΗΚΕΥΣΗ ΣΕ"
              options={LOCATION_OPTIONS}
              selected={location}
              onToggle={(id) => setLocation([id])}
              multiSelect={false}
            />
          </View>

          <View style={styles.section}>
            <ChipSelector
              label="ΤΥΠΟΣ ΗΜΕΡΟΜΗΝΙΑΣ"
              options={DATE_TYPE_OPTIONS}
              selected={dateType}
              onToggle={(id) => setDateType([id])}
              multiSelect={false}
              hint="Χρησιμοποίησε τον ακριβή τύπο από τη συσκευασία"
            />
            {dateType[0] !== 'NoPrintedDate' && dateType[0] !== 'Unknown' && (
              <View style={styles.dateInputWrapper}>
                <Text style={styles.fieldLabel}>ΗΜΕΡΟΜΗΝΙΑ ΑΠΟ ΣΥΣΚΕΥΑΣΙΑ</Text>
                <TextInput
                  style={styles.textInput}
                  value={printedDateText}
                  onChangeText={setPrintedDateText}
                  placeholder="π.χ. 15/11/2026"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.hint}>
                  Γράψε ακριβώς αυτό που βλέπεις στη συσκευασία
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Ανοιγμένο;</Text>
                <Text style={styles.switchSub}>Επηρεάζει τη διάρκεια ζωής</Text>
              </View>
              <Switch
                value={isOpened}
                onValueChange={setIsOpened}
                trackColor={{ false: colors.border, true: colors.category.health + '60' }}
                thumbColor={isOpened ? colors.category.health : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.fieldLabel}>ΣΗΜΕΙΩΣΕΙΣ (ΠΡΟΑΙΡΕΤΙΚΟ)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="π.χ. Ξεπαγωμένο χθες, Αγορά από λαϊκή"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.noteText}>
              Άγνωστη ημερομηνία παραμένει άγνωστη — δεν γίνεται εικασία για την ασφάλεια τροφίμων.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={() => handleSave(false)}
              disabled={!canSave || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.saveBtnText}>Προσθήκη τροφίμου</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addMoreBtn, !canSave && styles.saveBtnDisabled]}
              onPress={() => handleSave(true)}
              disabled={!canSave || saving}
              activeOpacity={0.8}
            >
              <Text style={styles.addMoreBtnText}>Προσθήκη κι άλλου</Text>
            </TouchableOpacity>
          </View>
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
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
    ...shadows.small,
  },
  fieldLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  textInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 44,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.s,
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  amountInput: { width: 100 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  switchLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  switchSub: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  dateInputWrapper: { marginTop: spacing.m },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
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
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  addMoreBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.category.health,
  },
  addMoreBtnText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.health,
  },
});
