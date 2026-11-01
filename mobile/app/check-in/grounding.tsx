import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, typography } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { looksLikeImmediateDanger, resolveTemplate } from '../../utils/checkIn';

export default function GroundingScreen() {
  const router = useRouter();
  const current = useCheckInStore((state) => state.current);
  const templates = useCheckInStore((state) => state.templates);
  const loadTemplates = useCheckInStore((state) => state.loadTemplates);
  const requestAssist = useCheckInStore((state) => state.requestAssist);
  const createPlan = useCheckInStore((state) => state.createPlan);
  const recordAttempt = useCheckInStore((state) => state.recordAttempt);
  const [useBreath, setUseBreath] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    void loadTemplates();
    void requestAssist({ supportType: 'settle' });
  }, [loadTemplates, requestAssist]);

  const notice = resolveTemplate(templates, 'sit-and-notice') ?? templates.find((item) => !item.isBreathing);
  const breath = resolveTemplate(templates, 'optional-slow-breath');
  const active = useBreath ? breath : notice;
  const danger = looksLikeImmediateDanger(current?.text);

  if (danger) {
    return (
      <CheckInChrome>
        <CrisisCard prominent />
        <SecondaryButton label={CHECK_IN_COPY.saveAndClose} onPress={() => router.replace('/(tabs)/cbt')} />
      </CheckInChrome>
    );
  }

  return (
    <CheckInChrome>
      <Text style={styles.title}>{active?.title ?? 'Settle for a moment'}</Text>
      <Text style={styles.body}>{active?.instructions}</Text>
      <Text style={styles.hint}>Stop whenever you want. Nothing here has to be finished.</Text>
      <PrimaryButton
        label={CHECK_IN_COPY.activity.tryNow}
        onPress={() => {
          if (!active) return;
          void createPlan({
            title: active.title,
            description: active.instructions,
            firstStep: active.firstStep,
            templateId: active.id,
            templateVersion: active.contentVersion,
            category: active.category,
            effort: active.effort,
            durationMinutes: active.durationMinutes,
            lifecycle: 'in_progress',
            checkInId: current?.id,
          }).then((plan) => setPlanId(plan.id));
        }}
      />
      {breath && !useBreath ? (
        <SecondaryButton label="I would rather try a breathing option" onPress={() => setUseBreath(true)} />
      ) : (
        <SecondaryButton label="Use a non-breathing option" onPress={() => setUseBreath(false)} />
      )}
      {planId ? (
        <SecondaryButton
          label={CHECK_IN_COPY.activity.didPart}
          onPress={() =>
            void recordAttempt(planId, { completionExtent: 'did_part' }).then(() => router.replace('/check-in/steps'))
          }
        />
      ) : null}
      <SecondaryButton label={CHECK_IN_COPY.thought.saveHere} onPress={() => router.replace('/(tabs)/cbt')} />
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
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    lineHeight: typography.lineHeight.caption,
  },
});
