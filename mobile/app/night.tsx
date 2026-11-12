import { useEffect, useRef } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../constants/designTokens';
import { NightBreath } from '../components/night/NightBreath';
import { useNightModeStore } from '../store/useNightModeStore';
import { useTaskStore } from '../store/useTaskStore';
import {
  COPY,
  NIGHT_TOTAL_SECONDS,
  STEP_SECONDS,
  currentCommand,
  currentSubtext,
  formatClock,
  primaryLabel,
  stepRemainingSeconds,
} from '../utils/nightMode';
import {
  enterNightImmersive,
  exitNightImmersive,
  setNightPinEnabled,
  speakNight,
  startNightPin,
  stopNightSpeech,
} from '../services/nightModeNative';

export default function NightScreen() {
  const router = useRouter();
  const session = useNightModeStore((s) => s.session);
  const dispatch = useNightModeStore((s) => s.dispatch);
  const hydrate = useNightModeStore((s) => s.hydrate);
  const prepareTomorrowPlan = useNightModeStore((s) => s.prepareTomorrowPlan);
  const askHelp = useNightModeStore((s) => s.askHelp);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const prepared = useRef(false);

  useEffect(() => {
    void hydrate();
    void fetchTasks();
    void enterNightImmersive();
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      const status = useNightModeStore.getState().session.status;
      if (status === 'NOT_DUE' || status === 'WAITING_FOR_FIRST_UNLOCK') {
        router.replace('/(tabs)');
        return true;
      }
      dispatch({ type: 'endEarly' });
      return true;
    });
    return () => {
      back.remove();
      stopNightSpeech();
      void exitNightImmersive();
    };
  }, [dispatch, fetchTasks, hydrate]);

  useEffect(() => {
    if (session.status !== 'ACTIVE') return;
    const id = setInterval(() => {
      dispatch({ type: 'tick' });
    }, 250);
    return () => clearInterval(id);
  }, [dispatch, session.status]);

  useEffect(() => {
    if ((session.status === 'COMPLETED' || session.status === 'ENDED_EARLY') && session.localDate) {
      void exitNightImmersive();
      router.replace('/(tabs)');
    }
  }, [router, session.localDate, session.status]);

  useEffect(() => {
    if (session.currentStep === 'close' && !prepared.current) {
      prepared.current = true;
      void prepareTomorrowPlan();
    }
  }, [prepareTomorrowPlan, session.currentStep]);

  const remaining = stepRemainingSeconds(session);
  const command = currentCommand(session);
  const sub = currentSubtext(session);
  const settle = session.currentStep === 'settle' && session.helpText !== COPY.settleStopped;
  const primary = primaryLabel(session);
  const waiting = session.status === 'NOT_DUE' || session.status === 'WAITING_FOR_FIRST_UNLOCK';

  useEffect(() => {
    if (session.status !== 'ACTIVE') return;
    speakNight(command);
  }, [command, session.status]);

  const onPrimary = () => {
    if (session.status === 'PAUSED' && session.currentStep !== 'settle') {
      dispatch({ type: 'resume' });
      return;
    }
    if (settle && !session.chimePlayed) {
      dispatch({ type: 'pause' });
      return;
    }
    if (session.status === 'PAUSED' && settle) {
      dispatch({ type: 'resume' });
      return;
    }
    dispatch({ type: 'ready' });
  };

  if (waiting) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Text style={styles.kicker}>{COPY.title}</Text>
          <View style={styles.center}>
            <Text style={styles.command}>After 22:00, on the first unlock.</Text>
            <Text style={styles.sub}>It will not start if the phone stays unlocked. One unlock. Once a day.</Text>
          </View>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.primary}>
            <Text style={styles.primaryText}>Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.kicker}>{COPY.title}</Text>
          <Text style={styles.total}>
            {formatClock(session.sessionElapsedSeconds)} / {formatClock(NIGHT_TOTAL_SECONDS)}
          </Text>
        </View>

        {settle ? (
          <View style={styles.center}>
            <Text style={styles.medTitle}>{COPY.settleTitle}</Text>
            <Text style={styles.medClock}>{formatClock(remaining)}</Text>
            <NightBreath enabled={session.breathingEnabled} />
            <Pressable onPress={() => dispatch({ type: 'pause' })} hitSlop={16}>
              <Text style={styles.ghost}>{session.status === 'PAUSED' ? COPY.resume : COPY.pause}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.stepClock}>{formatClock(remaining)}</Text>
            <Text style={styles.command}>{command}</Text>
            {sub ? <Text style={styles.sub}>{sub}</Text> : null}
            {session.currentStep === 'settle' && session.helpText === COPY.settleStopped ? (
              <Pressable onPress={() => dispatch({ type: 'quietAlternative' })} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>{COPY.sitQuietly}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.actions}>
          {!settle || session.chimePlayed || session.helpText === COPY.settleStopped ? (
            <Pressable style={styles.primary} onPress={onPrimary}>
              <Text style={styles.primaryText}>
                {session.status === 'PAUSED' && !settle ? COPY.resume : primary}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.row}>
            <Pressable onPress={() => dispatch({ type: session.status === 'PAUSED' ? 'resume' : 'pause' })}>
              <Text style={styles.ghost}>{session.status === 'PAUSED' ? COPY.resume : COPY.pause}</Text>
            </Pressable>
            <Pressable onPress={() => dispatch({ type: 'skip' })}>
              <Text style={styles.ghost}>{COPY.skip}</Text>
            </Pressable>
            <Pressable onPress={() => void askHelp()}>
              <Text style={styles.ghost}>{COPY.help}</Text>
            </Pressable>
            {session.currentStep === 'close' || session.currentStep === 'screens' || session.currentStep === 'prepare' ? (
              <Pressable onPress={() => dispatch({ type: session.currentStep === 'close' ? 'otherPlan' : 'easier' })}>
                <Text style={styles.ghost}>{session.currentStep === 'close' ? COPY.other : COPY.easier}</Text>
              </Pressable>
            ) : null}
            {remaining <= 0 && session.currentStep !== 'dim' ? (
              <Pressable onPress={() => dispatch({ type: 'extend' })}>
                <Text style={styles.ghost}>{COPY.extend}</Text>
              </Pressable>
            ) : null}
            {settle ? (
              <Pressable onPress={() => dispatch({ type: 'toggleBreathing' })}>
                <Text style={styles.ghost}>{session.breathingEnabled ? COPY.hideBreath : COPY.showBreath}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {session.confirmEnd ? (
          <View style={styles.confirm}>
            <Text style={styles.sub}>{COPY.endConfirm}</Text>
            <Pressable onPress={() => dispatch({ type: 'confirmEnd' })}>
              <Text style={styles.danger}>{COPY.endYes}</Text>
            </Pressable>
            <Pressable onPress={() => dispatch({ type: 'cancelEnd' })}>
              <Text style={styles.ghost}>{COPY.endNo}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onLongPress={() => dispatch({ type: 'endEarly' })}
            onPress={() => dispatch({ type: 'endEarly' })}
            hitSlop={12}
            style={styles.endWrap}
          >
            <Text style={styles.end}>{COPY.end}</Text>
          </Pressable>
        )}
        <Pressable
          onLongPress={async () => {
            const next = !session.pinEnabled;
            dispatch({ type: 'help' });
            await setNightPinEnabled(next);
            if (next) await startNightPin();
          }}
        >
          <Text style={styles.pinHint}>
            {session.currentStep === 'close' ? `${formatClock(STEP_SECONDS.close)}` : ' '}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070A09',
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
  },
  top: {
    paddingTop: spacing.m,
    gap: 4,
  },
  kicker: {
    color: colors.textMuted,
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },
  total: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.m,
  },
  stepClock: {
    color: colors.textMuted,
    fontSize: 18,
  },
  command: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: typography.fontWeight.semibold,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 26,
  },
  medTitle: {
    color: colors.textSecondary,
    fontSize: 18,
    letterSpacing: 1,
  },
  medClock: {
    color: colors.textPrimary,
    fontSize: 72,
    fontWeight: typography.fontWeight.semibold,
  },
  actions: {
    gap: spacing.m,
    paddingBottom: spacing.m,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: typography.fontWeight.semibold,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  ghost: {
    color: colors.textMuted,
    fontSize: 16,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  confirm: {
    gap: spacing.s,
    paddingBottom: spacing.s,
  },
  danger: {
    color: colors.danger,
    fontSize: 16,
  },
  endWrap: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.s,
  },
  end: {
    color: colors.textMuted,
    fontSize: 12,
    opacity: 0.55,
  },
  pinHint: {
    color: 'transparent',
    height: 8,
  },
});
