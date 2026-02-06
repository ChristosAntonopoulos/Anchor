import { View, Text, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface ReviewQuestionInputProps {
  question: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function ReviewQuestionInput({
  question,
  value,
  onChangeText,
  placeholder,
}: ReviewQuestionInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.inputWrapper}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  question: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  inputWrapper: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  input: {
    padding: spacing.m,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
