import { TouchableOpacity, Text, StyleSheet, Alert, TextInput, View } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface AddIncomeButtonProps {
  onAddIncome: (date: string, source: string, amount: number) => void;
}

export function AddIncomeButton({ onAddIncome }: AddIncomeButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');

  const handlePress = () => {
    setShowInput(true);
  };

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (source.trim() && !isNaN(amountNum) && amountNum > 0) {
      const today = new Date().toISOString().split('T')[0];
      onAddIncome(today, source.trim(), amountNum);
      setSource('');
      setAmount('');
      setShowInput(false);
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid source and amount.');
    }
  };

  const handleCancel = () => {
    setSource('');
    setAmount('');
    setShowInput(false);
  };

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
            placeholder="Source (e.g., Client A)"
            placeholderTextColor={colors.textSecondary}
            value={source}
            onChangeText={setSource}
            autoFocus
          />
        </LinearGradient>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputWrapper}
        >
          <TextInput
            style={styles.input}
            placeholder="Amount"
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </LinearGradient>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (!source.trim() || !amount) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!source.trim() || !amount}
          >
            <LinearGradient
              colors={(!source.trim() || !amount) ? [colors.border, colors.border] : [colors.category.leverage, colors.category.leverage + 'CC']}
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
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <LinearGradient
        colors={[colors.category.leverage, colors.category.leverage + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonGradient}
      >
        <Text style={styles.buttonText}>+ Log Income</Text>
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
});
