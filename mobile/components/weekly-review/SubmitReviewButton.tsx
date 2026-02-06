import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface SubmitReviewButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SubmitReviewButton({ onPress, loading, disabled }: SubmitReviewButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={disabled ? [colors.border, colors.border] : [colors.category.stability, colors.category.stability + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>Submit Review</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    marginBottom: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
