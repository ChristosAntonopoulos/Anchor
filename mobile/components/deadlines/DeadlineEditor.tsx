import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { Deadline, DeadlineStatus } from '../../types';

interface DeadlineEditorProps {
  visible: boolean;
  deadline?: Deadline | null;
  onClose: () => void;
  onSave: (input: { title: string; dueDate: string; importance: number; status?: DeadlineStatus }) => Promise<void>;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUSES: DeadlineStatus[] = ['on track', 'behind', 'completed'];

export function DeadlineEditor({ visible, deadline, onClose, onSave }: DeadlineEditorProps) {
  const [title, setTitle] = useState(deadline?.title ?? '');
  const [dueDate, setDueDate] = useState(deadline?.dueDate ?? todayIso());
  const [importance, setImportance] = useState(deadline?.importance ?? 3);
  const [status, setStatus] = useState<DeadlineStatus>(deadline?.status ?? 'on track');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const resetFrom = (next?: Deadline | null) => {
    setTitle(next?.title ?? '');
    setDueDate(next?.dueDate ?? todayIso());
    setImportance(next?.importance ?? 3);
    setStatus(next?.status ?? 'on track');
    setLocalError(null);
  };

  const handleShow = () => {
    resetFrom(deadline);
  };

  const canSave = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(dueDate);

  const handleSave = async () => {
    if (!canSave) {
      setLocalError('Title and a date as YYYY-MM-DD are required.');
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await onSave({
        title: title.trim(),
        dueDate,
        importance,
        status: deadline ? status : undefined,
      });
      onClose();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Could not save deadline');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={handleShow} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>{deadline ? 'Edit deadline' : 'New deadline'}</Text>
          <TextInput
            style={styles.input}
            placeholder="What needs a decision?"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus={!deadline}
          />
          <Text style={styles.label}>Due date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={dueDate}
            onChangeText={setDueDate}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Importance</Text>
          <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, importance === value && styles.chipOn]}
                onPress={() => setImportance(value)}
              >
                <Text style={[styles.chipText, importance === value && styles.chipTextOn]}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {deadline ? (
            <>
              <Text style={styles.label}>Status</Text>
              <View style={styles.row}>
                {STATUSES.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, status === value && styles.chipOn]}
                    onPress={() => setStatus(value)}
                  >
                    <Text style={[styles.chipText, status === value && styles.chipTextOn]}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
          {localError ? <Text style={styles.error}>{localError}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.ghost} onPress={onClose} disabled={saving}>
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primary, (!canSave || saving) && styles.primaryDisabled]}
              onPress={() => void handleSave()}
              disabled={!canSave || saving}
            >
              <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 25, 0.72)',
    justifyContent: 'center',
    padding: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.l,
    gap: spacing.s,
  },
  heading: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    textTransform: 'capitalize',
  },
  chipTextOn: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  error: {
    color: colors.danger,
    fontSize: typography.fontSize.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  ghost: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: {
    color: colors.textSecondary,
  },
  primary: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
});
