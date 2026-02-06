import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    padding: spacing.m,
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: '#991B1B',
  },
  dismissButton: {
    marginLeft: spacing.s,
    padding: spacing.xs,
  },
  dismissText: {
    fontSize: 20,
    color: '#991B1B',
    fontWeight: 'bold',
  },
});
