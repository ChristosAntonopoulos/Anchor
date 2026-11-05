import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../constants/designTokens';
import { CHECK_IN_COPY } from '../../constants/checkIn';

export function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') {
    return null;
  }
  const label =
    status === 'saving' ? CHECK_IN_COPY.saving : status === 'saved' ? CHECK_IN_COPY.saved : CHECK_IN_COPY.saveError;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.text, status === 'error' ? styles.error : null]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  error: {
    color: colors.error,
  },
});
