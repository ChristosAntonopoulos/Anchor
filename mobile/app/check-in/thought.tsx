import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { SaveStatus } from '../../components/checkIn/SaveStatus';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { confirmedFeelings, formatFeeling } from '../../utils/checkIn';

const SHORT_STEPS = ['situation', 'thought', 'feeling'] as const;
const FULL_STEPS = ['evidenceFor', 'evidenceAgainst', 'balanced', 'feelingNow'] as const;

export default function ThoughtScreen() {
  const router = useRouter();
  const current = useCheckInStore((state) => state.current);
  const saveStatus = useCheckInStore((state) => state.saveStatus);
  const saveThought = useCheckInStore((state) => state.saveThought);
  const existingFeelings = current ? confirmedFeelings(current).map(formatFeeling).join(', ') : '';

  const [step, setStep] = useState(0);
  const [full, setFull] = useState(false);
  const [situation, setSituation] = useState(current?.situation ?? current?.text ?? '');
  const [thought, setThought] = useState(current?.automaticThoughts?.[0]?.text ?? '');
  const [feeling, setFeeling] = useState(existingFeelings);
  const [evidenceFor, setEvidenceFor] = useState(current?.evidenceFor?.[0] ?? '');
  const [evidenceAgainst, setEvidenceAgainst] = useState(current?.evidenceAgainst?.[0] ?? '');
  const [balanced, setBalanced] = useState(current?.alternativeThoughts?.[0] ?? '');
  const [feelingNow, setFeelingNow] = useState('');
  const [beliefBefore, setBeliefBefore] = useState<number | undefined>(current?.beliefBefore);
  const [beliefAfter, setBeliefAfter] = useState<number | undefined>(current?.beliefAfter);

  const keys = full ? [...SHORT_STEPS, ...FULL_STEPS] : [...SHORT_STEPS];
  const currentKey = keys[Math.min(step, keys.length - 1)];
  const prompt = CHECK_IN_COPY.thought[currentKey];
  const valueMap: Record<string, string> = {
    situation,
    thought,
    feeling,
    evidenceFor,
    evidenceAgainst,
    balanced,
    feelingNow,
  };
  const setterMap: Record<string, (value: string) => void> = {
    situation: setSituation,
    thought: setThought,
    feeling: setFeeling,
    evidenceFor: setEvidenceFor,
    evidenceAgainst: setEvidenceAgainst,
    balanced: setBalanced,
    feelingNow: setFeelingNow,
  };

  const payload = useMemo(
    () => ({
      situation: situation.trim() || undefined,
      automaticThoughts: thought.trim() ? [{ text: thought.trim() }] : undefined,
      evidenceFor: evidenceFor.trim() ? [evidenceFor.trim()] : undefined,
      evidenceAgainst: evidenceAgainst.trim() ? [evidenceAgainst.trim()] : undefined,
      alternativeThoughts: balanced.trim() ? [balanced.trim()] : undefined,
      outcome: feelingNow.trim() || undefined,
      thoughtState: full ? 'completed' : 'draft',
      supportType: 'understand_thought',
      beliefBefore,
      beliefAfter,
    }),
    [situation, thought, evidenceFor, evidenceAgainst, balanced, feelingNow, full, beliefBefore, beliefAfter]
  );

  const persist = (state: 'draft' | 'completed') =>
    saveThought({ ...payload, thoughtState: state, recordState: state === 'completed' ? 'saved' : 'draft' });

  const atEnd = step >= keys.length - 1;

  return (
    <CheckInChrome
      footer={
        <>
          <SaveStatus status={saveStatus} />
          {!atEnd ? (
            <PrimaryButton
              label={CHECK_IN_COPY.continue}
              onPress={() => {
                void persist('draft');
                setStep((value) => value + 1);
              }}
            />
          ) : !full ? (
            <PrimaryButton
              label={CHECK_IN_COPY.thought.explore}
              onPress={() => {
                setFull(true);
                setStep(SHORT_STEPS.length);
              }}
            />
          ) : (
            <PrimaryButton
              label={CHECK_IN_COPY.thought.saveHere}
              onPress={() => {
                void persist('completed').then(() => router.replace('/(tabs)/cbt'));
              }}
            />
          )}
          <SecondaryButton
            label={CHECK_IN_COPY.thought.chooseStep}
            onPress={() => {
              void persist('draft').then(() => router.push('/check-in/activity'));
            }}
          />
          <SecondaryButton
            label={CHECK_IN_COPY.thought.saveHere}
            onPress={() => {
              void persist(full ? 'completed' : 'draft').then(() => router.replace('/(tabs)/cbt'));
            }}
          />
          <SecondaryButton label={CHECK_IN_COPY.skip} onPress={() => setStep((value) => Math.min(value + 1, keys.length - 1))} />
        </>
      }
    >
      <Text style={styles.title}>{prompt}</Text>
      {currentKey !== 'feeling' || !existingFeelings ? null : (
        <Text style={styles.hint}>{CHECK_IN_COPY.thought.suggestion}</Text>
      )}
      <TextInput
        style={styles.input}
        value={valueMap[currentKey]}
        onChangeText={setterMap[currentKey]}
        placeholder="You can skip this."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        accessibilityLabel={prompt}
      />
      {(currentKey === 'thought' || currentKey === 'balanced') && (
        <View>
          <Text style={styles.hint}>
            {currentKey === 'thought' ? CHECK_IN_COPY.thought.belief : 'Optional after rating'}
          </Text>
          <View style={styles.scale}>
            {[0, 2, 4, 6, 8, 10].map((value) => {
              const selected = currentKey === 'thought' ? beliefBefore === value : beliefAfter === value;
              return (
                <SecondaryButton
                  key={value}
                  label={`${value}`}
                  onPress={() =>
                    currentKey === 'thought'
                      ? setBeliefBefore((currentValue) => (currentValue === value ? undefined : value))
                      : setBeliefAfter((currentValue) => (currentValue === value ? undefined : value))
                  }
                  style={selected ? styles.selected : undefined}
                />
              );
            })}
          </View>
        </View>
      )}
      <CrisisCard />
    </CheckInChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
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
  scale: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  selected: {
    borderColor: colors.category.health,
  },
});
