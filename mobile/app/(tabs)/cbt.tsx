import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CheckInChrome } from '../../components/checkIn/CheckInChrome';
import { CrisisCard } from '../../components/checkIn/CrisisCard';
import { PrimaryButton, SecondaryButton } from '../../components/checkIn/CheckInButtons';
import { CHECK_IN_COPY } from '../../constants/checkIn';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { consumePendingCheckInOffer } from '../../services/phoneUnlockListener';
import { useCheckInStore } from '../../store/useCheckInStore';

const QUICK_CHOICES: { code: string; label: string }[] = [
  { code: 'anxious', label: 'Anxious' },
  { code: 'sad_low', label: 'Low' },
  { code: 'overwhelmed', label: 'Overwhelmed' },
  { code: 'numb_disconnected', label: 'Numb' },
  { code: 'happy_content', label: 'Okay' },
  { code: 'more', label: 'More…' },
];

export default function CheckInLandingScreen() {
  const router = useRouter();
  const draftId = useCheckInStore((state) => state.draftId);
  const loadLanding = useCheckInStore((state) => state.loadLanding);
  const [unlockOfferId, setUnlockOfferId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadLanding();
      void consumePendingCheckInOffer().then((id) => {
        if (id) {
          setUnlockOfferId(id);
        }
      });
    }, [loadLanding])
  );

  const openCapture = (feeling?: string) => {
    const query = feeling && feeling !== 'more' ? `?feeling=${feeling}` : '';
    router.push(`/check-in/capture${query}`);
  };

  return (
    <CheckInChrome>
      <Text style={styles.title}>{CHECK_IN_COPY.landingTitle}</Text>
      <Text style={styles.subtitle}>{CHECK_IN_COPY.landingSubtitle}</Text>
      <Text style={styles.support}>{CHECK_IN_COPY.landingSupport}</Text>

      <PrimaryButton label={CHECK_IN_COPY.write} onPress={() => openCapture()} />

      <View style={styles.quickWrap} accessibilityRole="list" accessibilityLabel="Quick choices">
        {QUICK_CHOICES.map((choice) => (
          <Pressable
            key={choice.code}
            onPress={() => openCapture(choice.code)}
            accessibilityRole="button"
            accessibilityLabel={choice.label}
            style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
          >
            <Text style={styles.quickText}>{choice.label}</Text>
          </Pressable>
        ))}
      </View>

      <SecondaryButton
        label={CHECK_IN_COPY.smallStep}
        onPress={() => router.push('/check-in/capture?intent=small_step')}
      />

      {draftId ? (
        <SecondaryButton
          label={CHECK_IN_COPY.continueDraft}
          onPress={() => router.push(`/check-in/capture?id=${draftId}`)}
        />
      ) : null}

      {unlockOfferId ? (
        <SecondaryButton
          label={CHECK_IN_COPY.unlockOffer}
          onPress={() => {
            const id = unlockOfferId;
            setUnlockOfferId(null);
            router.push(`/check-in/capture?unlockEventId=${id}&intent=small_step`);
          }}
        />
      ) : null}

      <View style={styles.destinations}>
        <Pressable
          onPress={() => router.push('/check-in/steps')}
          accessibilityRole="button"
          accessibilityLabel={CHECK_IN_COPY.mySteps}
          style={styles.destination}
        >
          <Text style={styles.destinationTitle}>{CHECK_IN_COPY.mySteps}</Text>
          <Text style={styles.destinationBody}>Chosen activities, plans, and things tried.</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/check-in/history')}
          accessibilityRole="button"
          accessibilityLabel={CHECK_IN_COPY.history}
          style={styles.destination}
        >
          <Text style={styles.destinationTitle}>{CHECK_IN_COPY.history}</Text>
          <Text style={styles.destinationBody}>Previous check-ins and linked exercises.</Text>
        </Pressable>
      </View>

      <CrisisCard />
    </CheckInChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.title,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  support: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    lineHeight: typography.lineHeight.caption,
  },
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  quick: {
    minHeight: 44,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  quickText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
  },
  pressed: {
    opacity: 0.8,
  },
  destinations: {
    gap: spacing.s,
  },
  destination: {
    minHeight: 48,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.m,
  },
  destinationTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  destinationBody: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
  },
});
