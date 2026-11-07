import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { confirmedFeelings, formatFeeling, isCheckInRecord, isDraft } from '../../utils/checkIn';

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const current = useCheckInStore((state) => state.current);
  const plans = useCheckInStore((state) => state.plans);
  const openEntry = useCheckInStore((state) => state.openEntry);
  const updateCurrent = useCheckInStore((state) => state.updateCurrent);
  const deleteCurrent = useCheckInStore((state) => state.deleteCurrent);
  const loadPlans = useCheckInStore((state) => state.loadPlans);
  const [title, setTitle] = useState(current?.title ?? '');

  useEffect(() => {
    if (id) {
      void openEntry(id).then((entry) => setTitle(entry?.title ?? ''));
      void loadPlans(id);
    }
  }, [id, openEntry, loadPlans]);

  if (!current || current.id !== id) {
    return (
      <CheckInChrome>
        <Text style={styles.body}>Loading this check-in…</Text>
      </CheckInChrome>
    );
  }

  const feelings = confirmedFeelings(current);
  const linked = plans.filter((plan) => plan.checkInId === current.id);

  return (
    <CheckInChrome>
      <Text style={styles.meta}>
        {new Date(current.occurredAtUtc ?? current.createdAt).toLocaleString()} ·{' '}
        {isDraft(current) ? CHECK_IN_COPY.draft : isCheckInRecord(current) ? CHECK_IN_COPY.finished : CHECK_IN_COPY.legacy}
      </Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        onEndEditing={() => {
          if (title.trim() && title.trim() !== current.title) {
            void updateCurrent({ title: title.trim() });
          }
        }}
        accessibilityLabel="Title"
      />
      {current.text ? <Text style={styles.body}>{current.text}</Text> : null}
      {feelings.length > 0 ? <Text style={styles.meta}>{feelings.map(formatFeeling).join(' · ')}</Text> : null}
      {current.energy ? <Text style={styles.meta}>Energy: {current.energy.replace('_', ' ')}</Text> : null}
      {current.situation ? <Text style={styles.body}>Situation: {current.situation}</Text> : null}
      {current.automaticThoughts?.[0]?.text ? (
        <Text style={styles.body}>Thought: {current.automaticThoughts[0].text}</Text>
      ) : null}
      {current.evidenceFor?.[0] ? <Text style={styles.meta}>What makes it feel true: {current.evidenceFor[0]}</Text> : null}
      {current.evidenceAgainst?.[0] ? (
        <Text style={styles.meta}>What it might leave out: {current.evidenceAgainst[0]}</Text>
      ) : null}
      {current.alternativeThoughts?.[0] ? (
        <Text style={styles.body}>Fairer description: {current.alternativeThoughts[0]}</Text>
      ) : null}
      {current.problemSolving?.specificProblem ? (
        <Text style={styles.body}>Problem: {current.problemSolving.specificProblem}</Text>
      ) : null}
      {current.problemSolving?.smallestNextStep ? (
        <Text style={styles.body}>Smallest step: {current.problemSolving.smallestNextStep}</Text>
      ) : null}
      {linked.map((plan) => (
        <Text key={plan.id} style={styles.meta}>
          Linked step: {plan.title}
        </Text>
      ))}
      {isDraft(current) ? (
        <PrimaryButton label={CHECK_IN_COPY.continueDraft} onPress={() => router.push(`/check-in/capture?id=${current.id}`)} />
      ) : null}
      <SecondaryButton
        label="Delete this check-in"
        onPress={() => void deleteCurrent().then(() => router.replace('/check-in/history'))}
      />
      <CrisisCard />
    </CheckInChrome>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    paddingHorizontal: spacing.m,
  },
  body: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
});
