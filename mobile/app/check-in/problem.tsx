import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { SaveStatus } from '../../components/checkIn/SaveStatus';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';

const STEPS = ['specific', 'influence', 'options', 'workable', 'smallest'] as const;

export default function ProblemScreen() {
  const router = useRouter();
  const current = useCheckInStore((state) => state.current);
  const saveStatus = useCheckInStore((state) => state.saveStatus);
  const saveProblem = useCheckInStore((state) => state.saveProblem);
  const createPlan = useCheckInStore((state) => state.createPlan);
  const existing = current?.problemSolving;

  const [step, setStep] = useState(0);
  const [specific, setSpecific] = useState(existing?.specificProblem ?? current?.text ?? '');
  const [influence, setInfluence] = useState(existing?.controllablePart ?? '');
  const [options, setOptions] = useState(existing?.options?.join('\n') ?? '');
  const [workable, setWorkable] = useState(existing?.selectedOption ?? '');
  const [smallest, setSmallest] = useState(existing?.smallestNextStep ?? '');

  const values = { specific, influence, options, workable, smallest };
  const setters = {
    specific: setSpecific,
    influence: setInfluence,
    options: setOptions,
    workable: setWorkable,
    smallest: setSmallest,
  };
  const key = STEPS[step];

  const persist = (state: 'draft' | 'completed') =>
    saveProblem({
      specificProblem: specific.trim() || undefined,
      controllablePart: influence.trim() || undefined,
      options: options
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      selectedOption: workable.trim() || undefined,
      smallestNextStep: smallest.trim() || undefined,
      state,
    });

  const finish = async (next: 'save' | 'step' | 'support' | 'wait') => {
    const completed = next !== 'wait';
    await persist(completed ? 'completed' : 'draft');
    if (next === 'step' && smallest.trim() && current) {
      await createPlan({
        title: smallest.trim(),
        firstStep: smallest.trim(),
        checkInId: current.id,
        lifecycle: 'planned',
        category: 'necessary',
      });
      router.push('/check-in/steps');
      return;
    }
    if (next === 'support') {
      await persist('completed');
      router.replace('/(tabs)/cbt');
      return;
    }
    router.replace('/(tabs)/cbt');
  };

  return (
    <CheckInChrome
      footer={
        <>
          <SaveStatus status={saveStatus} />
          {step < STEPS.length - 1 ? (
            <PrimaryButton
              label={CHECK_IN_COPY.continue}
              onPress={() => {
                void persist('draft');
                setStep((value) => value + 1);
              }}
            />
          ) : (
            <PrimaryButton label="Save this step" onPress={() => void finish('step')} />
          )}
          <SecondaryButton label={CHECK_IN_COPY.problem.needsSupport} onPress={() => void finish('support')} />
          <SecondaryButton label={CHECK_IN_COPY.problem.cannotAct} onPress={() => void finish('wait')} />
          <SecondaryButton label={CHECK_IN_COPY.skip} onPress={() => setStep((value) => Math.min(value + 1, STEPS.length - 1))} />
        </>
      }
    >
      <Text style={styles.title}>{CHECK_IN_COPY.problem[key]}</Text>
      <TextInput
        style={styles.input}
        value={values[key]}
        onChangeText={setters[key]}
        placeholder="You can skip this."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        accessibilityLabel={CHECK_IN_COPY.problem[key]}
      />
      {key === 'options' ? <Text style={styles.hint}>One option per line is enough.</Text> : null}
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
});
