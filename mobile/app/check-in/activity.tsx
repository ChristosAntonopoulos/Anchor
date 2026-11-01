import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { SaveStatus } from '../../components/checkIn/SaveStatus';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { effortLabel, looksLikeImmediateDanger, resolveTemplate } from '../../utils/checkIn';
import type { ActivityTemplate, BehavioralActivity } from '../../types';

export default function ActivityScreen() {
  const router = useRouter();
  const current = useCheckInStore((state) => state.current);
  const templates = useCheckInStore((state) => state.templates);
  const assist = useCheckInStore((state) => state.assist);
  const saveStatus = useCheckInStore((state) => state.saveStatus);
  const loadTemplates = useCheckInStore((state) => state.loadTemplates);
  const requestAssist = useCheckInStore((state) => state.requestAssist);
  const createPlan = useCheckInStore((state) => state.createPlan);
  const recordAttempt = useCheckInStore((state) => state.recordAttempt);
  const linkTask = useCheckInStore((state) => state.linkTask);
  const dismissTemplate = useCheckInStore((state) => state.dismissTemplate);
  const createDraft = useCheckInStore((state) => state.createDraft);

  const [index, setIndex] = useState(0);
  const [smaller, setSmaller] = useState(false);
  const [custom, setCustom] = useState('');
  const [plan, setPlan] = useState<BehavioralActivity | null>(null);
  const [phase, setPhase] = useState<'choose' | 'doing' | 'followup' | 'done'>('choose');
  const [usefulness, setUsefulness] = useState<string | undefined>();
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    void (async () => {
      await loadTemplates();
      if (!current) {
        await createDraft({ recordState: 'draft', supportType: 'small_step' });
      }
      await requestAssist({ supportType: 'small_step' });
    })();
  }, [loadTemplates, requestAssist, current, createDraft]);

  const suggestions = assist?.suggestedActions ?? [];
  const primary = suggestions[index % Math.max(suggestions.length, 1)];
  const alternatives = suggestions.filter((_, itemIndex) => itemIndex !== index % Math.max(suggestions.length, 1)).slice(0, 2);
  const template = resolveTemplate(templates, primary?.templateId);
  const danger = looksLikeImmediateDanger(current?.text);

  const title = useMemo(() => {
    if (smaller && template) {
      return template.smallerVersion;
    }
    return template?.title ?? primary?.proposedFirstStep ?? 'A small step';
  }, [smaller, template, primary]);

  const startPlan = async (lifecycle: 'in_progress' | 'planned', source?: ActivityTemplate) => {
    const chosen = source ?? template;
    const created = await createPlan({
      title: custom.trim() || title,
      description: chosen?.instructions,
      firstStep: smaller ? chosen?.smallerVersion : chosen?.firstStep ?? title,
      templateId: chosen?.id,
      templateVersion: chosen?.contentVersion,
      category: chosen?.category,
      effort: chosen?.effort,
      durationMinutes: chosen?.durationMinutes,
      lifecycle,
      checkInId: current?.id,
    });
    setPlan(created);
    if (lifecycle === 'in_progress') {
      setPhase('doing');
    } else {
      router.push('/check-in/steps');
    }
  };

  if (danger) {
    return (
      <CheckInChrome>
        <CrisisCard prominent />
        <Text style={styles.body}>Ordinary activity suggestions are paused here. You can still write or leave.</Text>
        <SecondaryButton label={CHECK_IN_COPY.saveAndClose} onPress={() => router.replace('/(tabs)/cbt')} />
      </CheckInChrome>
    );
  }

  return (
    <CheckInChrome
      footer={
        phase === 'choose' ? (
          <>
            <PrimaryButton label={CHECK_IN_COPY.activity.tryNow} onPress={() => void startPlan('in_progress')} />
            <SecondaryButton label={CHECK_IN_COPY.activity.makeSmaller} onPress={() => setSmaller(true)} />
            <SecondaryButton
              label={CHECK_IN_COPY.activity.another}
              onPress={() => {
                if (primary?.templateId) {
                  dismissTemplate(primary.templateId);
                }
                setIndex((value) => value + 1);
                setSmaller(false);
                void requestAssist({ supportType: 'small_step' });
              }}
            />
            <SecondaryButton label={CHECK_IN_COPY.activity.saveLater} onPress={() => void startPlan('planned')} />
          </>
        ) : phase === 'doing' && plan ? (
          <>
            <PrimaryButton label={CHECK_IN_COPY.activity.whatHappened} onPress={() => setPhase('followup')} />
            <SecondaryButton
              label={CHECK_IN_COPY.activity.addTask}
              onPress={() => void linkTask(plan.id)}
            />
          </>
        ) : phase === 'followup' && plan ? (
          <>
            <PrimaryButton
              label={CHECK_IN_COPY.saveAndClose}
              onPress={() => {
                void recordAttempt(plan.id, {
                  completionExtent: 'did_it',
                  usefulness,
                }).then(() => {
                  setPhase('done');
                  router.replace('/check-in/steps');
                });
              }}
            />
            <SecondaryButton label={CHECK_IN_COPY.skip} onPress={() => router.replace('/(tabs)/cbt')} />
          </>
        ) : null
      }
    >
      {phase === 'choose' ? (
        <>
          <Text style={styles.title}>{title}</Text>
          {template ? <Text style={styles.meta}>{effortLabel(template.effort, template.durationMinutes)}</Text> : null}
          <Text style={styles.body}>{smaller ? template?.smallerVersion : template?.instructions}</Text>
          {primary?.rationale ? <Text style={styles.hint}>{primary.rationale}</Text> : null}
          {alternatives.map((item) => {
            const alt = resolveTemplate(templates, item.templateId);
            return alt ? (
              <SecondaryButton
                key={item.templateId}
                label={alt.title}
                onPress={() => void startPlan('in_progress', alt)}
              />
            ) : null;
          })}
          <TextInput
            style={styles.input}
            value={custom}
            onChangeText={setCustom}
            placeholder={CHECK_IN_COPY.activity.chooseOwn}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={CHECK_IN_COPY.activity.chooseOwn}
          />
        </>
      ) : null}

      {phase === 'doing' && plan ? (
        <>
          <Text style={styles.title}>{plan.title}</Text>
          <Text style={styles.body}>{plan.firstStep ?? plan.description}</Text>
          <Text style={styles.hint}>A timer is optional and does not prove you finished.</Text>
        </>
      ) : null}

      {phase === 'followup' ? (
        <>
          <Text style={styles.title}>{CHECK_IN_COPY.activity.whatHappened}</Text>
          <View style={styles.row}>
            <SecondaryButton
              label={CHECK_IN_COPY.activity.didIt}
              onPress={() => plan && void recordAttempt(plan.id, { completionExtent: 'did_it', usefulness })}
            />
            <SecondaryButton
              label={CHECK_IN_COPY.activity.didPart}
              onPress={() => plan && void recordAttempt(plan.id, { completionExtent: 'did_part', usefulness })}
            />
            <SecondaryButton
              label={CHECK_IN_COPY.activity.didntTry}
              onPress={() => plan && void recordAttempt(plan.id, { completionExtent: 'didnt_try', usefulness })}
            />
          </View>
          <Text style={styles.section}>{CHECK_IN_COPY.activity.usefulness}</Text>
          <View style={styles.row}>
            {[
              ['helpful', CHECK_IN_COPY.activity.helpful],
              ['a_little_helpful', CHECK_IN_COPY.activity.aLittle],
              ['not_helpful', CHECK_IN_COPY.activity.notHelpful],
              ['made_things_harder', CHECK_IN_COPY.activity.harder],
              ['not_sure', CHECK_IN_COPY.activity.notSure],
            ].map(([code, label]) => (
              <SecondaryButton key={code} label={label} onPress={() => setUsefulness(code)} />
            ))}
          </View>
          <SecondaryButton
            label={showMore ? 'Hide extra questions' : 'A few optional questions'}
            onPress={() => setShowMore((value) => !value)}
          />
          {showMore ? (
            <Text style={styles.hint}>
              {CHECK_IN_COPY.activity.enjoyment} {CHECK_IN_COPY.activity.accomplishment} {CHECK_IN_COPY.activity.changeNext} You
              can skip all of these. An unchanged mood is not a failure.
            </Text>
          ) : null}
        </>
      ) : null}

      <SaveStatus status={saveStatus} />
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
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
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
  section: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  row: {
    gap: spacing.s,
  },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: spacing.m,
  },
});
