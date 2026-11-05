import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { effortLabel, groupActivityPlans } from '../../utils/checkIn';
import type { BehavioralActivity } from '../../types';

function PlanCard({
  plan,
  group,
  onTry,
  onLog,
}: {
  plan: BehavioralActivity;
  group: 'ready' | 'planned' | 'previously';
  onTry: () => void;
  onLog: () => void;
}) {
  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={plan.title}>
      <Text style={styles.cardTitle}>{plan.title}</Text>
      {group !== 'previously' && plan.firstStep ? <Text style={styles.cardBody}>{plan.firstStep}</Text> : null}
      {group === 'planned' && plan.scheduledDate ? (
        <Text style={styles.meta}>Planned for {new Date(plan.scheduledDate).toLocaleString()}</Text>
      ) : null}
      {group === 'previously' && plan.completionExtent ? (
        <Text style={styles.meta}>{CHECK_IN_COPY.activity.youCanChange}</Text>
      ) : null}
      {plan.effort || plan.durationMinutes ? <Text style={styles.meta}>{effortLabel(plan.effort, plan.durationMinutes)}</Text> : null}
      {group === 'ready' ? <PrimaryButton label={CHECK_IN_COPY.activity.tryNow} onPress={onTry} /> : null}
      {group === 'planned' ? <SecondaryButton label="Log what happened" onPress={onLog} /> : null}
    </View>
  );
}

export default function StepsScreen() {
  const router = useRouter();
  const plans = useCheckInStore((state) => state.plans);
  const loadPlans = useCheckInStore((state) => state.loadPlans);
  const updatePlan = useCheckInStore((state) => state.updatePlan);
  const linkTask = useCheckInStore((state) => state.linkTask);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans])
  );

  const groups = groupActivityPlans(plans);

  return (
    <CheckInChrome>
      <Text style={styles.title}>{CHECK_IN_COPY.mySteps}</Text>
      <Text style={styles.body}>Chosen activities stay here. A scheduled time does not mean you tried it.</Text>

      <Text style={styles.section}>{CHECK_IN_COPY.activity.ready}</Text>
      {groups.ready.length === 0 ? <Text style={styles.meta}>Nothing waiting to be tried.</Text> : null}
      {groups.ready.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          group="ready"
          onTry={() => void updatePlan(plan.id, { lifecycle: 'in_progress' }).then(() => router.push('/check-in/activity'))}
          onLog={() => router.push('/check-in/activity')}
        />
      ))}

      <Text style={styles.section}>{CHECK_IN_COPY.activity.planned}</Text>
      {groups.planned.map((plan) => (
        <View key={plan.id}>
          <PlanCard
            plan={plan}
            group="planned"
            onTry={() => undefined}
            onLog={() => router.push('/check-in/activity')}
          />
          {!plan.linkedTaskId ? (
            <Pressable onPress={() => void linkTask(plan.id)} accessibilityRole="button" accessibilityLabel={CHECK_IN_COPY.activity.addTask}>
              <Text style={styles.link}>{CHECK_IN_COPY.activity.addTask}</Text>
            </Pressable>
          ) : (
            <Text style={styles.meta}>On your task list</Text>
          )}
        </View>
      ))}

      <Text style={styles.section}>{CHECK_IN_COPY.activity.previously}</Text>
      {groups.previously.map((plan) => (
        <PlanCard key={plan.id} plan={plan} group="previously" onTry={() => undefined} onLog={() => undefined} />
      ))}
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
  body: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  section: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.s,
  },
  card: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.m,
    gap: spacing.s,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  cardBody: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  link: {
    color: colors.category.work,
    fontSize: typography.fontSize.body,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
