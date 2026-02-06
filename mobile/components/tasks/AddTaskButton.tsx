import { TouchableOpacity, Text, StyleSheet, Alert, TextInput, View } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { Category } from '../../types';

interface AddTaskButtonProps {
  onAddTask: (title: string, category: Category) => void;
  disabled: boolean;
}

export function AddTaskButton({ onAddTask, disabled }: AddTaskButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('work');

  const handlePress = () => {
    if (disabled) {
      Alert.alert('Limit Reached', 'Maximum 5 tasks allowed per day.');
      return;
    }
    setShowInput(true);
  };

  const handleSubmit = () => {
    if (title.trim()) {
      onAddTask(title.trim(), category);
      setTitle('');
      setShowInput(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setShowInput(false);
  };

  const categories: { value: Category; label: string; color: string }[] = [
    { value: 'work', label: 'Work', color: colors.category.work },
    { value: 'leverage', label: 'Leverage', color: colors.category.leverage },
    { value: 'health', label: 'Health', color: colors.category.health },
    { value: 'stability', label: 'Stability', color: colors.category.stability },
  ];

  if (showInput) {
    return (
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputWrapper}
        >
          <TextInput
            style={styles.input}
            placeholder="Task title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <View style={styles.categoryChips}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.7}
                >
                  {category === cat.value ? (
                    <LinearGradient
                      colors={[cat.color, cat.color + 'CC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryChipActive}
                    >
                      <Text style={styles.categoryChipTextActive}>{cat.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.categoryChip, { borderColor: cat.color + '40' }]}>
                      <Text style={[styles.categoryChipText, { color: cat.color }]}>
                        {cat.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </LinearGradient>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, !title.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!title.trim()}
          >
            <LinearGradient
              colors={!title.trim() ? [colors.border, colors.border] : [colors.category.work, colors.category.work + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <LinearGradient
        colors={disabled ? [colors.border, colors.border] : [colors.category.work, colors.category.work + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonGradient}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          + Add Task
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: spacing.l,
    marginTop: spacing.m,
  },
  inputWrapper: {
    borderRadius: borderRadius.medium,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  input: {
    padding: spacing.m,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  categoryContainer: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  categoryLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.s,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  categoryChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  categoryChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.regular,
  },
  categoryChipTextActive: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
