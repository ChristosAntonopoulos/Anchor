import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { ChoiceChips } from '../../components/checkIn/ChoiceChips';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { SaveStatus } from '../../components/checkIn/SaveStatus';
import {
  CHECK_IN_COPY,
  ENERGY_CODES,
  EXTRA_STATE_CODES,
  FEELING_CODES,
} from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { feelingFromCode, useCheckInStore } from '../../store/useCheckInStore';
import { looksLikeImmediateDanger } from '../../utils/checkIn';
import type { FeelingRating } from '../../types';

export default function CheckInCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; feeling?: string; intent?: string; unlockEventId?: string }>();
  const current = useCheckInStore((state) => state.current);
  const saveStatus = useCheckInStore((state) => state.saveStatus);
  const createDraft = useCheckInStore((state) => state.createDraft);
  const updateCurrent = useCheckInStore((state) => state.updateCurrent);
  const openEntry = useCheckInStore((state) => state.openEntry);

  const [text, setText] = useState(current?.text ?? '');
  const [selected, setSelected] = useState<string[]>(
    current?.feelings?.map((feeling) => feeling.code).filter((code): code is string => Boolean(code)) ??
      (params.feeling && params.feeling !== 'more' ? [params.feeling] : [])
  );
  const [intensities, setIntensities] = useState<Record<string, number | undefined>>({});
  const [customLabel, setCustomLabel] = useState('');
  const [energy, setEnergy] = useState<string | undefined>(current?.energy);
  const [showMore, setShowMore] = useState(params.feeling === 'more');

  useEffect(() => {
    if (params.id && current?.id !== params.id) {
      void openEntry(params.id).then((entry) => {
        if (!entry) return;
        setText(entry.text ?? '');
        setSelected(entry.feelings?.map((feeling) => feeling.code).filter((code): code is string => Boolean(code)) ?? []);
        setEnergy(entry.energy);
      });
    }
  }, [params.id, current?.id, openEntry]);

  const feelings: FeelingRating[] = useMemo(
    () =>
      selected.map((code) =>
        feelingFromCode(code, intensities[code]).code === 'other' && customLabel
          ? { ...feelingFromCode(code, intensities[code]), customLabel }
          : feelingFromCode(code, intensities[code])
      ),
    [selected, intensities, customLabel]
  );

  const persist = async (recordState: 'draft' | 'saved', supportType?: string) => {
    const payload = {
      text: text.trim() || undefined,
      feelings: feelings.length ? feelings : undefined,
      energy,
      recordState,
      supportType,
      linkedUnlockEventId: params.unlockEventId,
    };
    if (!payload.text && !payload.feelings) {
      return current ?? null;
    }
    if (current) {
      return updateCurrent(payload);
    }
    return createDraft(payload);
  };

  const goNext = async (supportType?: string) => {
    const entry = await persist('draft', supportType);
    if (!entry) {
      return;
    }
    if (params.intent === 'small_step' || supportType === 'small_step') {
      router.replace('/check-in/activity');
      return;
    }
    router.push('/check-in/support');
  };

  const handleSaveAndClose = async () => {
    const entry = await persist('saved', 'save');
    if (entry) {
      router.replace('/(tabs)/cbt');
    }
  };

  const toggleFeeling = (code: string) => {
    setSelected((currentCodes) =>
      currentCodes.includes(code) ? currentCodes.filter((item) => item !== code) : [...currentCodes, code]
    );
  };

  const danger = looksLikeImmediateDanger(text);
  const canSave = text.trim().length > 0 || selected.length > 0;

  return (
    <CheckInChrome
      footer={
        <>
          <SaveStatus status={saveStatus} />
          <PrimaryButton
            label={CHECK_IN_COPY.continue}
            onPress={() => void goNext(params.intent === 'small_step' ? 'small_step' : undefined)}
            disabled={!canSave}
          />
          <SecondaryButton
            label={CHECK_IN_COPY.saveAndClose}
            onPress={() => void handleSaveAndClose()}
            disabled={!canSave}
          />
        </>
      }
    >
      <Text style={styles.title}>{CHECK_IN_COPY.capturePrompt}</Text>
      <View style={styles.examples}>
        {CHECK_IN_COPY.captureExamples.map((example) => (
          <Pressable
            key={example}
            onPress={() => setText((value) => (value ? value : example.replace('…', ' ')))}
            accessibilityRole="button"
            accessibilityLabel={example}
          >
            <Text style={styles.example}>{example}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={CHECK_IN_COPY.landingSubtitle}
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        accessibilityLabel={CHECK_IN_COPY.capturePrompt}
      />

      <Text style={styles.section}>{CHECK_IN_COPY.feelingQuestion}</Text>
      <ChoiceChips
        accessibilityLabel={CHECK_IN_COPY.feelingQuestion}
        options={(showMore ? [...FEELING_CODES, ...EXTRA_STATE_CODES] : FEELING_CODES.slice(0, 6)).map((code) => ({
          code,
          label: CHECK_IN_COPY.feelings[code],
        }))}
        selected={selected}
        onToggle={toggleFeeling}
      />
      {!showMore ? (
        <SecondaryButton label="More…" onPress={() => setShowMore(true)} />
      ) : (
        <ChoiceChips
          accessibilityLabel={CHECK_IN_COPY.extraStates}
          options={EXTRA_STATE_CODES.map((code) => ({ code, label: CHECK_IN_COPY.feelings[code] }))}
          selected={selected}
          onToggle={toggleFeeling}
        />
      )}
      {selected.includes('other') ? (
        <TextInput
          style={styles.smallInput}
          value={customLabel}
          onChangeText={setCustomLabel}
          placeholder="Your own words"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Your own feeling label"
        />
      ) : null}

      {selected.length > 0 ? (
        <View style={styles.intensityBlock}>
          <Text style={styles.section}>{CHECK_IN_COPY.intensityQuestion}</Text>
          <Text style={styles.hint}>
            {CHECK_IN_COPY.intensityLow} · {CHECK_IN_COPY.intensityHigh}
          </Text>
          {selected.map((code) => (
            <View key={code} style={styles.intensityRow}>
              <Text style={styles.intensityLabel}>{CHECK_IN_COPY.feelings[code as keyof typeof CHECK_IN_COPY.feelings]}</Text>
              <View style={styles.scale}>
                {[0, 2, 4, 6, 8, 10].map((value) => {
                  const active = intensities[code] === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() =>
                        setIntensities((currentValue) => ({
                          ...currentValue,
                          [code]: currentValue[code] === value ? undefined : value,
                        }))
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${value} out of 10`}
                      accessibilityState={{ selected: active }}
                      style={[styles.scaleChip, active && styles.scaleActive]}
                    >
                      <Text style={styles.scaleText}>{value}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.section}>{CHECK_IN_COPY.energyQuestion}</Text>
      <ChoiceChips
        accessibilityLabel={CHECK_IN_COPY.energyQuestion}
        options={ENERGY_CODES.map((code) => ({ code, label: CHECK_IN_COPY.energy[code] }))}
        selected={energy ? [energy] : []}
        onToggle={(code) => setEnergy((currentEnergy) => (currentEnergy === code ? undefined : code))}
      />

      {danger ? <CrisisCard prominent /> : null}
    </CheckInChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
  },
  examples: {
    gap: spacing.xs,
  },
  example: {
    color: colors.category.work,
    fontSize: typography.fontSize.caption,
    minHeight: 32,
  },
  input: {
    minHeight: 140,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    padding: spacing.m,
  },
  smallInput: {
    minHeight: 48,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    paddingHorizontal: spacing.m,
  },
  section: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.s,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  intensityBlock: {
    gap: spacing.s,
  },
  intensityRow: {
    gap: spacing.xs,
  },
  intensityLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  scale: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  scaleChip: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scaleActive: {
    borderWidth: 2,
    borderColor: colors.category.health,
    backgroundColor: colors.category.health + '24',
  },
  scaleText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
  },
});
