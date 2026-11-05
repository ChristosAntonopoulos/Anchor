import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { Task } from '../../types';

interface FirstActionBannerProps {
  task: Task;
  onUse: () => void;
  onEdit: (text: string) => void;
}

export function FirstActionBanner({ task, onUse, onEdit }: FirstActionBannerProps) {
  const suggestion = task.pendingSuggestion;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(suggestion?.nextAction?.text ?? '');

  if (!suggestion?.nextAction?.text) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Suggested first step</Text>
      {editing ? (
        <TextInput style={styles.input} value={text} onChangeText={setText} />
      ) : (
        <Text style={styles.action}>{suggestion.nextAction.text}</Text>
      )}
      {suggestion.reason ? <Text style={styles.reason}>{suggestion.reason}</Text> : null}
      <View style={styles.row}>
        <TouchableOpacity style={styles.primary} onPress={() => (editing ? onEdit(text) : onUse())}>
          <Text style={styles.primaryText}>{editing ? 'Save' : 'Use this'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={() => setEditing((value) => !value)}>
          <Text style={styles.ghostText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.l,
    marginTop: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.aiContainer,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  label: {
    color: colors.aiAccent,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  action: { color: colors.textPrimary, fontSize: typography.fontSize.body },
  reason: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: 4 },
  input: {
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderControl,
    borderRadius: 8,
    padding: 8,
  },
  row: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.s },
  primary: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 10, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: '600' },
  ghost: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderControl,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  ghostText: { color: colors.textPrimary },
});
