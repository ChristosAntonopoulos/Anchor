import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { SaveStatus } from '../../components/checkIn/SaveStatus';
import { CHECK_IN_COPY, SUPPORT_TYPES } from '../../constants/checkIn';
import { colors, spacing, typography } from '../../constants/designTokens';
import { useCheckInStore } from '../../store/useCheckInStore';
import { looksLikeImmediateDanger } from '../../utils/checkIn';

const ROUTES: Record<string, string> = {
  understand_thought: '/check-in/thought',
  work_problem: '/check-in/problem',
  small_step: '/check-in/activity',
  settle: '/check-in/grounding',
};

export default function CheckInSupportScreen() {
  const router = useRouter();
  const current = useCheckInStore((state) => state.current);
  const saveStatus = useCheckInStore((state) => state.saveStatus);
  const chooseSupport = useCheckInStore((state) => state.chooseSupport);

  const handleChoice = async (supportType: (typeof SUPPORT_TYPES)[number]) => {
    await chooseSupport(supportType);
    if (supportType === 'save') {
      router.replace('/(tabs)/cbt');
      return;
    }
    router.push(ROUTES[supportType]);
  };

  return (
    <CheckInChrome>
      <Text style={styles.title}>{CHECK_IN_COPY.supportQuestion}</Text>
      {current?.text ? <Text style={styles.preview}>{current.text}</Text> : null}
      <SaveStatus status={saveStatus} />
      <View style={styles.list}>
        {SUPPORT_TYPES.map((code, index) => {
          const copy = CHECK_IN_COPY.supports[code];
          const Button = index === 0 ? PrimaryButton : SecondaryButton;
          return (
            <View key={code} style={styles.item}>
              <Button label={copy.title} onPress={() => void handleChoice(code)} />
              <Text style={styles.body}>{copy.body}</Text>
            </View>
          );
        })}
      </View>
      {looksLikeImmediateDanger(current?.text) ? <CrisisCard prominent /> : <CrisisCard />}
    </CheckInChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
  },
  preview: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  list: {
    gap: spacing.l,
  },
  item: {
    gap: spacing.s,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    lineHeight: typography.lineHeight.caption,
  },
});
