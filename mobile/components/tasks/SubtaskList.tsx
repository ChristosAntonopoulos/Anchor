import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { Subtask } from '../../types';

interface SubtaskListProps {
  subtasks: Subtask[];
  onUpdate: (id: string, updates: Partial<Subtask>) => void;
  onRemove: (id: string) => void;
}

export function SubtaskList({ subtasks, onUpdate, onRemove }: SubtaskListProps) {
  if (subtasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No checklist items yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {subtasks.map((subtask, index) => (
        <View key={subtask.id} style={styles.subtaskRow}>
          <TouchableOpacity
            style={[styles.checkbox, subtask.completed && styles.checkboxChecked]}
            onPress={() => onUpdate(subtask.id, { completed: !subtask.completed })}
          >
            {subtask.completed && (
              <Ionicons name="checkmark" size={16} color={colors.background} />
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, subtask.completed && styles.inputCompleted]}
            placeholder={`Checklist item ${index + 1}`}
            placeholderTextColor={colors.textSecondary}
            value={subtask.title}
            onChangeText={(text) => onUpdate(subtask.id, { title: text })}
            editable={!subtask.completed}
          />
          <TouchableOpacity
            onPress={() => onRemove(subtask.id)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.s,
  },
  emptyContainer: {
    padding: spacing.m,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    padding: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.category.work,
    borderColor: colors.category.work,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  inputCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.xs,
  },
});
