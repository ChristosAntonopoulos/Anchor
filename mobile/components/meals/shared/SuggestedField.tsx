import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../constants/designTokens';

interface SuggestedFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suggested?: boolean;
  protected?: boolean;
  onAccept?: () => void;
  onRevert?: () => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  optional?: boolean;
  hint?: string;
}

export function SuggestedField({
  label,
  value,
  onChangeText,
  placeholder,
  suggested = false,
  protected: isProtected = false,
  onAccept,
  onRevert,
  multiline = false,
  keyboardType = 'default',
  optional = false,
  hint,
}: SuggestedFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}> (optional)</Text>}
        {suggested && !isProtected && (
          <View style={styles.suggestedBadge}>
            <Ionicons name="sparkles" size={10} color={colors.category.work} />
            <Text style={styles.suggestedText}>AI suggestion</Text>
          </View>
        )}
        {isProtected && (
          <View style={styles.protectedBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
            <Text style={styles.protectedText}>You edited this</Text>
          </View>
        )}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={[styles.inputWrapper, suggested && !isProtected && styles.inputWrapperSuggested]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          keyboardType={keyboardType}
          editable={!isProtected}
          numberOfLines={multiline ? 3 : 1}
        />
        {suggested && !isProtected && onAccept && (
          <TouchableOpacity onPress={onAccept} style={styles.acceptBtn} accessibilityLabel="Accept suggestion">
            <Ionicons name="checkmark" size={18} color={colors.category.health} />
          </TouchableOpacity>
        )}
        {isProtected && onRevert && (
          <TouchableOpacity onPress={onRevert} style={styles.revertBtn} accessibilityLabel="Revert suggestion">
            <Ionicons name="refresh" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optional: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  suggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.category.work + '20',
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 3,
  },
  suggestedText: {
    fontSize: 10,
    color: colors.category.work,
    fontWeight: typography.fontWeight.semibold,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 3,
  },
  protectedText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  inputWrapperSuggested: {
    borderColor: colors.category.work + '60',
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 24,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  acceptBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  revertBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
