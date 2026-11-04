import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, gradients } from '../../constants/designTokens';
import { SESSION_DURATIONS, formatElapsed, remainingMs, resolveSessionMinutes, STUCK_CHOICES } from '../../utils/execution';
import { useExecutionStore } from '../../store/useExecutionStore';
import type { SessionLaunch, StuckHelp } from '../../types/execution';

interface WorkSessionModalProps {
  visible: boolean;
  onClose: () => void;
  pendingStart?: SessionLaunch | null;
}

export function WorkSessionModal({ visible, onClose, pendingStart }: WorkSessionModalProps) {
  const session = useExecutionStore((s) => s.session);
  const profile = useExecutionStore((s) => s.profile);
  const stuck = useExecutionStore((s) => s.stuck);
  const start = useExecutionStore((s) => s.start);
  const pause = useExecutionStore((s) => s.pause);
  const resume = useExecutionStore((s) => s.resume);
  const timeCheck = useExecutionStore((s) => s.timeCheck);
  const captureDistraction = useExecutionStore((s) => s.captureDistraction);
  const finish = useExecutionStore((s) => s.finish);
  const askStuck = useExecutionStore((s) => s.askStuck);
  const useStuck = useExecutionStore((s) => s.useStuck);
  const clearStuck = useExecutionStore((s) => s.clearStuck);
  const draftReturnPoint = useExecutionStore((s) => s.draftReturnPoint);

  const [tick, setTick] = useState(0);
  const [distraction, setDistraction] = useState('');
  const [showDistraction, setShowDistraction] = useState(false);
  const [showStuck, setShowStuck] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [returnPoint, setReturnPoint] = useState('');
  const [checkedTime, setCheckedTime] = useState(false);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES(pendingStart, profile?.lastExplicitDurationMinutes));
  const [customMinutes, setCustomMinutes] = useState('');
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [actionText, setActionText] = useState(pendingStart?.currentAction ?? '');
  const [stuckEdit, setStuckEdit] = useState('');
  const [editingStuck, setEditingStuck] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setMinutes(DEFAULT_MINUTES(pendingStart, profile?.lastExplicitDurationMinutes));
    setActionText(pendingStart?.currentAction ?? '');
    setTimerEnabled(profile?.preferredTimerStyle !== 'none');
    setShowFinish(false);
    setShowStuck(false);
    setShowDistraction(false);
    setReturnPoint('');
    setCustomMinutes('');
  }, [visible, pendingStart, profile?.lastExplicitDurationMinutes, profile?.preferredTimerStyle]);

  useEffect(() => {
    if (!visible || session?.status !== 'running' || !session.timerEnabled) {
      return;
    }
    const id = setInterval(() => setTick((value) => value + 1), 500);
    return () => clearInterval(id);
  }, [visible, session?.status, session?.timerEnabled]);

  const elapsed = (session?.elapsedMs ?? 0) + (
    session?.status === 'running' && session.startedAt
      ? Date.now() - new Date(session.startedAt).getTime()
      : 0
  );
  const remaining = remainingMs(session?.plannedMinutes, elapsed);

  useEffect(() => {
    if (!session || session.status !== 'running' || !session.timerEnabled || remaining === null) {
      return;
    }
    if (remaining <= 0 && !checkedTime) {
      setCheckedTime(true);
      void timeCheck();
    }
  }, [remaining, session, checkedTime, timeCheck, tick]);

  useEffect(() => {
    if (session?.status === 'running') {
      setCheckedTime(false);
    }
  }, [session?.status]);

  useEffect(() => {
    if (stuck?.suggestedAction) {
      setStuckEdit(stuck.suggestedAction);
      setEditingStuck(false);
    }
  }, [stuck?.suggestedAction]);

  if (!visible) {
    return null;
  }

  const inSetup = !session;
  const clock = session && (session.timerStyle === 'elapsed' || remaining === null)
    ? formatElapsed(elapsed)
    : formatElapsed(remaining ?? 0);

  const closeAndFinish = async (outcome: string) => {
    await finish({
      outcome,
      returnPoint: returnPoint.trim() || undefined,
    });
    setShowFinish(false);
    onClose();
  };

  const confirmStart = async () => {
    const chosen = customMinutes.trim()
      ? Number.parseInt(customMinutes, 10)
      : minutes;
    const resolved = Number.isFinite(chosen) && chosen > 0
      ? resolveSessionMinutes(chosen)
      : resolveSessionMinutes(minutes, profile?.lastExplicitDurationMinutes);
    await start({
      taskId: pendingStart?.taskId,
      blockId: pendingStart?.blockId,
      minutes: timerEnabled ? resolved : resolved,
      timerEnabled,
      currentAction: actionText || pendingStart?.currentAction,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <LinearGradient colors={gradients.background.colors} start={gradients.background.start} end={gradients.background.end} style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}><Text style={styles.link}>Close</Text></TouchableOpacity>
              <Text style={styles.kicker}>{session?.taskTitle ?? pendingStart?.title ?? 'Session'}</Text>
              <View style={{ width: 48 }} />
            </View>

            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Current action</Text>
              <Text style={styles.action}>{session?.currentAction ?? actionText}</Text>
              {session?.upcomingSteps && session.upcomingSteps.length > 0 ? (
                <Text style={styles.meta}>Later: {session.upcomingSteps.slice(0, 3).join(' · ')}</Text>
              ) : null}

              {inSetup ? (
                <View style={styles.panel}>
                  <Text style={styles.title}>How long to start?</Text>
                  <View style={styles.chips}>
                    {SESSION_DURATIONS.map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.chip, minutes === value && !customMinutes && styles.chipOn]}
                        onPress={() => {
                          setMinutes(value);
                          setCustomMinutes('');
                        }}
                      >
                        <Text style={styles.chipText}>{value} min</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="Custom minutes"
                    placeholderTextColor={colors.textSecondary}
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                  />
                  <TouchableOpacity style={styles.ghost} onPress={() => setTimerEnabled((value) => !value)}>
                    <Text style={styles.ghostText}>{timerEnabled ? 'Use no timer' : 'Timer off — tap to enable'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primary} onPress={() => void confirmStart()}>
                    <Text style={styles.primaryText}>
                      {timerEnabled ? `Start for ${customMinutes || minutes} minutes` : 'Start without a timer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : session.timerEnabled ? (
                <Text style={styles.clock}>{clock}</Text>
              ) : (
                <Text style={styles.meta}>No timer</Text>
              )}

              {session?.status === 'time_check' ? (
                <View style={styles.panel}>
                  <Text style={styles.title}>Time check</Text>
                  <TouchableOpacity style={styles.primary} onPress={() => void resume()}><Text style={styles.primaryText}>Continue</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.ghost} onPress={() => void pause()}><Text style={styles.ghostText}>Take a break</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.ghost} onPress={() => setShowFinish(true)}><Text style={styles.ghostText}>Finish</Text></TouchableOpacity>
                </View>
              ) : null}

              {stuck ? (
                <StuckResult
                  stuck={stuck}
                  editing={editingStuck}
                  editText={stuckEdit}
                  onChangeEdit={setStuckEdit}
                  onEdit={() => setEditingStuck(true)}
                  onUse={() => {
                    const text = editingStuck ? stuckEdit : stuck.suggestedAction;
                    void useStuck(text, pendingStart?.taskId).then(() => setActionText(text));
                  }}
                  onLeave={() => {
                    clearStuck();
                    if (session) setShowFinish(true);
                  }}
                />
              ) : null}

              {showStuck && !stuck ? (
                <StuckChoices
                  onSmaller={() => {
                    setShowStuck(false);
                    void askStuck({ makeSmaller: true, taskId: session?.taskId ?? pendingStart?.taskId });
                  }}
                  onChoice={(choice) => {
                    setShowStuck(false);
                    void askStuck({ choice, taskId: session?.taskId ?? pendingStart?.taskId });
                  }}
                />
              ) : null}

              {showDistraction ? (
                <View style={styles.panel}>
                  <TextInput
                    style={styles.input}
                    placeholder="Park the thought in one line"
                    placeholderTextColor={colors.textSecondary}
                    value={distraction}
                    onChangeText={setDistraction}
                  />
                  <TouchableOpacity
                    style={styles.primary}
                    onPress={() => {
                      if (distraction.trim()) {
                        void captureDistraction(distraction.trim());
                      }
                      setDistraction('');
                      setShowDistraction(false);
                    }}
                  >
                    <Text style={styles.primaryText}>Save and return</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {showFinish ? (
                <View style={styles.panel}>
                  <Text style={styles.title}>Where should we pick up?</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Optional"
                    placeholderTextColor={colors.textSecondary}
                    value={returnPoint}
                    onChangeText={setReturnPoint}
                  />
                  <TouchableOpacity
                    style={styles.ghost}
                    onPress={async () => {
                      const draft = await draftReturnPoint(returnPoint);
                      if (draft?.returnPoint) {
                        setReturnPoint(draft.returnPoint);
                      }
                    }}
                  >
                    <Text style={styles.ghostText}>Draft from notes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primary} onPress={() => void closeAndFinish('progress')}><Text style={styles.primaryText}>Made progress</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.ghost} onPress={() => void closeAndFinish('finished_task')}><Text style={styles.ghostText}>Finished task</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.ghost} onPress={() => void closeAndFinish('did_not_start')}><Text style={styles.ghostText}>Did not get started</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => void closeAndFinish('left')}><Text style={styles.link}>Leave without this</Text></TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>

            {(inSetup || session?.status !== 'time_check') && !showFinish ? (
              <View style={styles.footer}>
                {!inSetup && session?.status === 'running' ? (
                  <TouchableOpacity style={styles.ghost} onPress={() => void pause()}><Text style={styles.ghostText}>Pause</Text></TouchableOpacity>
                ) : null}
                {!inSetup && session?.status === 'paused' ? (
                  <TouchableOpacity style={styles.ghost} onPress={() => void resume()}><Text style={styles.ghostText}>Resume</Text></TouchableOpacity>
                ) : null}
                {!inSetup ? (
                  <TouchableOpacity style={styles.ghost} onPress={() => setShowDistraction(true)}><Text style={styles.ghostText}>Capture distraction</Text></TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.ghost} onPress={() => setShowStuck(true)}><Text style={styles.ghostText}>I am stuck</Text></TouchableOpacity>
                {!inSetup ? (
                  <TouchableOpacity style={styles.primary} onPress={() => setShowFinish(true)}><Text style={styles.primaryText}>Finish</Text></TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

function DEFAULT_MINUTES(pendingStart: SessionLaunch | null | undefined, lastExplicit?: number) {
  return resolveSessionMinutes(pendingStart?.minutes, lastExplicit);
}

function StuckChoices({ onSmaller, onChoice }: { onSmaller: () => void; onChoice: (choice: string) => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>I am stuck</Text>
      <TouchableOpacity style={styles.primary} onPress={onSmaller}><Text style={styles.primaryText}>Make this smaller</Text></TouchableOpacity>
      <Text style={styles.meta}>Or say what is in the way</Text>
      {STUCK_CHOICES.map((choice) => (
        <TouchableOpacity key={choice.id} style={styles.ghost} onPress={() => onChoice(choice.id)}>
          <Text style={styles.ghostText}>{choice.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StuckResult({
  stuck,
  editing,
  editText,
  onChangeEdit,
  onEdit,
  onUse,
  onLeave,
}: {
  stuck: StuckHelp;
  editing: boolean;
  editText: string;
  onChangeEdit: (text: string) => void;
  onEdit: () => void;
  onUse: () => void;
  onLeave: () => void;
}) {
  return (
    <View style={styles.panel}>
      {editing ? (
        <TextInput style={styles.input} value={editText} onChangeText={onChangeEdit} />
      ) : (
        <Text style={styles.title}>{stuck.suggestedAction}</Text>
      )}
      <Text style={styles.meta}>{stuck.explanation}</Text>
      {stuck.alternative ? <Text style={styles.meta}>{stuck.alternative}</Text> : null}
      <TouchableOpacity style={styles.primary} onPress={onUse}><Text style={styles.primaryText}>Use this</Text></TouchableOpacity>
      <TouchableOpacity style={styles.ghost} onPress={onEdit}><Text style={styles.ghostText}>Edit</Text></TouchableOpacity>
      <TouchableOpacity style={styles.ghost} onPress={onLeave}><Text style={styles.ghostText}>Leave for now</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.m },
  kicker: { color: colors.textSecondary, fontSize: typography.fontSize.caption },
  body: { flex: 1, paddingHorizontal: spacing.l },
  label: { color: colors.textSecondary, fontSize: typography.fontSize.caption },
  action: { color: colors.textPrimary, fontSize: 22, fontWeight: typography.fontWeight.bold, marginTop: spacing.s },
  clock: { color: colors.category.work, fontSize: 48, fontWeight: typography.fontWeight.bold, marginVertical: spacing.l },
  meta: { color: colors.textSecondary, marginTop: spacing.s, fontSize: typography.fontSize.caption },
  panel: { backgroundColor: colors.surface, borderRadius: borderRadius.large, padding: spacing.m, marginTop: spacing.m },
  title: { color: colors.textPrimary, fontSize: typography.fontSize.title, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.s },
  input: { color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.medium, padding: spacing.s, marginBottom: spacing.s },
  primary: { backgroundColor: colors.category.work, borderRadius: borderRadius.medium, padding: spacing.s, alignItems: 'center', marginTop: spacing.s },
  primaryText: { color: colors.background, fontWeight: typography.fontWeight.semibold },
  ghost: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.medium, padding: spacing.s, alignItems: 'center', marginTop: spacing.s },
  ghostText: { color: colors.textPrimary },
  link: { color: colors.category.stability, textDecorationLine: 'underline', marginTop: spacing.s, textAlign: 'center' },
  footer: { padding: spacing.m, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.s },
  chip: { paddingHorizontal: spacing.m, paddingVertical: spacing.xs, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: '#31443C', borderColor: colors.category.leverage },
  chipText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
});
