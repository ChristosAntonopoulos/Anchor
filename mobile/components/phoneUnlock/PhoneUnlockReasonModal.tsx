import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import {
  FEELING_CODES,
  INTENTION_CODES,
  PHONE_UNLOCK_NOTE_MAX_LENGTH,
  TRIGGER_CODES,
  UNLOCK_COPY,
  noteCopyForIntention,
  type IntentionCode,
} from '../../utils/phoneUnlockMapping';
import { beginUnlockPrompt, resolveUnlockPrompt } from '../../services/phoneUnlockPrompt';
import { useRouter } from 'expo-router';
import { CHECK_IN_COPY } from '../../constants/checkIn';

interface PhoneUnlockReasonModalProps {
  visible: boolean;
  unlockTime: number;
  onClose?: () => void;
}

const INTENTION_ICONS: Record<IntentionCode, string> = {
  specific_task: 'tasks',
  connection: 'heart',
  intentional_break: 'sleep',
  social_check: 'notification',
  pay: 'goals',
  automatic_check: 'habits',
  unsure: 'search',
  other: 'add',
};

export function PhoneUnlockReasonModal({
  visible,
  unlockTime,
  onClose,
}: PhoneUnlockReasonModalProps) {
  const router = useRouter();
  const [promptId, setPromptId] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [contextExpanded, setContextExpanded] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      submittingRef.current = false;
      setPromptId(null);
      setIntention(null);
      setTrigger(null);
      setFeeling(null);
      setNote('');
      setContextExpanded(false);
      return;
    }

    let cancelled = false;
    void beginUnlockPrompt(unlockTime).then((id) => {
      if (!cancelled) {
        setPromptId(id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visible, unlockTime]);

  const noteCopy = useMemo(() => noteCopyForIntention(intention), [intention]);

  const close = () => {
    onClose?.();
  };

  const submit = async (input: {
    skip: boolean;
    keepContext: boolean;
    action: 'continue' | 'put_down' | 'skip' | null;
    status: 'answered' | 'skipped' | 'dismissed';
    path: 'quick_choice' | 'context_form' | 'direct_action' | null;
    nextIntention?: string | null;
  }) => {
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    const id = promptId ?? `unlock-prompt-${unlockTime}`;
    const payload = {
      promptId: id,
      unlockTime,
      skip: input.skip,
      keepContext: input.keepContext,
      contextExpanded,
      intention: input.nextIntention !== undefined ? input.nextIntention : intention,
      trigger,
      feeling,
      note,
      action: input.action,
      status: input.status,
      path: input.path,
      putDownExecution: (input.action === 'put_down' ? 'overlay_dismissed' : null) as
        | 'overlay_dismissed'
        | null,
    };
    close();
    try {
      await resolveUnlockPrompt(payload);
    } catch (error) {
      console.error('[PhoneUnlockReasonModal] Could not save unlock prompt', error);
    }
    return id;
  };

  const onIntentionPress = (code: string) => {
    if (contextExpanded) {
      setIntention((current) => (current === code ? null : code));
      return;
    }
    void submit({
      skip: false,
      keepContext: false,
      action: 'continue',
      status: 'answered',
      path: 'quick_choice',
      nextIntention: code,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => {
        void submit({
          skip: false,
          keepContext: false,
          action: null,
          status: 'dismissed',
          path: null,
        });
      }}
    >
      <LinearGradient
        colors={['#0F1419', '#1A1F2E', '#0F1419']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.card}>
                <Text style={styles.title} accessibilityRole="header">
                  {UNLOCK_COPY.title}
                </Text>
                <Text style={styles.subtitle}>{UNLOCK_COPY.subtitle}</Text>

                <View style={styles.intentionGrid}>
                  {INTENTION_CODES.map((code) => {
                    const copy = UNLOCK_COPY.intentions[code];
                    const selected = intention === code;
                    return (
                      <View key={code} style={styles.intentionSlot}>
                        <Pressable
                          onPress={() => onIntentionPress(code)}
                          accessibilityRole="button"
                          accessibilityLabel={`${copy.label}. ${copy.support}`}
                          accessibilityState={{ selected: contextExpanded ? selected : false }}
                          style={({ pressed }) => [
                            styles.intentionCell,
                            selected && contextExpanded ? styles.intentionRowSelected : null,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <AppIcon name={INTENTION_ICONS[code]} size={18} color={colors.success} />
                          <Text style={styles.intentionLabel}>{copy.label}</Text>
                          <Text style={styles.intentionSupport}>{copy.support}</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                {!contextExpanded ? (
                  <View style={styles.addContextWrap}>
                    <TouchableOpacity
                      onPress={() => setContextExpanded(true)}
                      accessibilityRole="button"
                      accessibilityLabel={`${UNLOCK_COPY.addContext}. ${UNLOCK_COPY.addContextHelper}`}
                      style={styles.addContextButton}
                    >
                      <Text style={styles.addContextText}>{UNLOCK_COPY.addContext}</Text>
                    </TouchableOpacity>
                    <Text style={styles.helperCenter}>{UNLOCK_COPY.addContextHelper}</Text>
                  </View>
                ) : (
                  <View style={styles.contextSection}>
                    <Text style={styles.helper}>{UNLOCK_COPY.contextHelper}</Text>

                    <Text style={styles.sectionLabel}>{UNLOCK_COPY.triggerQuestion}</Text>
                    <View style={styles.chipGrid}>
                      {TRIGGER_CODES.map((code) => (
                        <Chip
                          key={code}
                          label={UNLOCK_COPY.triggers[code]}
                          selected={trigger === code}
                          onPress={() => setTrigger((current) => (current === code ? null : code))}
                        />
                      ))}
                    </View>

                    <Text style={styles.sectionLabel}>{UNLOCK_COPY.feelingQuestion}</Text>
                    <View style={styles.chipGrid}>
                      {FEELING_CODES.map((code) => (
                        <Chip
                          key={code}
                          label={UNLOCK_COPY.feelings[code]}
                          selected={feeling === code}
                          onPress={() => setFeeling((current) => (current === code ? null : code))}
                        />
                      ))}
                    </View>

                    <Text style={styles.sectionLabel}>{noteCopy.label}</Text>
                    <TextInput
                      style={styles.note}
                      placeholder={noteCopy.placeholder}
                      placeholderTextColor={colors.textSecondary}
                      value={note}
                      onChangeText={setNote}
                      multiline
                      maxLength={PHONE_UNLOCK_NOTE_MAX_LENGTH}
                      autoFocus={false}
                      textAlignVertical="top"
                      accessibilityLabel={noteCopy.label}
                    />

                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={() =>
                        void submit({
                          skip: false,
                          keepContext: true,
                          action: 'continue',
                          status: 'answered',
                          path: 'context_form',
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={UNLOCK_COPY.continue}
                    >
                      <Text style={styles.continueText}>{UNLOCK_COPY.continue}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.putDownButton}
                  onPress={() =>
                    void submit({
                      skip: false,
                      keepContext: contextExpanded,
                      action: 'put_down',
                      status: 'answered',
                      path: 'direct_action',
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={UNLOCK_COPY.putPhoneDown}
                >
                  <Text style={styles.putDownText}>{UNLOCK_COPY.putPhoneDown}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => {
                    void submit({
                      skip: false,
                      keepContext: contextExpanded,
                      action: 'continue',
                      status: 'answered',
                      path: contextExpanded ? 'context_form' : 'quick_choice',
                    }).then((id) => {
                      if (id) {
                        router.push(`/check-in/capture?unlockEventId=${id}&intent=small_step`);
                      }
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={CHECK_IN_COPY.unlockOffer}
                >
                  <Text style={styles.skipText}>{CHECK_IN_COPY.unlockOffer}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() =>
                    void submit({
                      skip: true,
                      keepContext: false,
                      action: 'skip',
                      status: 'skipped',
                      path: 'direct_action',
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={UNLOCK_COPY.skip}
                >
                  <Text style={styles.skipText}>{UNLOCK_COPY.skip}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={selected ? `${label}. ${UNLOCK_COPY.selected}` : label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.s,
    marginBottom: spacing.m,
    lineHeight: typography.lineHeight.body,
  },
  intentionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: spacing.xs,
  },
  intentionSlot: {
    width: '50%',
    maxWidth: '50%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  intentionCell: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.medium,
    minHeight: 88,
    paddingVertical: 10,
    paddingHorizontal: spacing.s,
  },
  intentionRowSelected: {
    backgroundColor: '#31443C',
  },
  intentionLabel: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.s,
  },
  intentionSupport: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  addContextWrap: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addContextButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
  },
  addContextText: {
    color: '#C7E5CD',
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },
  helperCenter: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.s,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.s,
  },
  contextSection: {
    marginTop: spacing.s,
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  chip: {
    flexBasis: '50%',
    maxWidth: '50%',
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  chipSelected: {},
  chipText: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.s,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 48,
    fontSize: 13,
  },
  chipTextSelected: {
    backgroundColor: '#31443C',
    color: '#C7E5CD',
  },
  note: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.medium,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    minHeight: 88,
    padding: spacing.s,
  },
  continueButton: {
    backgroundColor: '#C7E5CD',
    borderRadius: borderRadius.medium,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.m,
  },
  continueText: {
    color: '#132E2A',
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
  putDownButton: {
    borderWidth: 1,
    borderColor: '#C7E5CD',
    backgroundColor: '#31443C',
    borderRadius: borderRadius.medium,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.m,
  },
  putDownText: {
    color: '#C7E5CD',
    fontSize: 16,
  },
  skipButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});
