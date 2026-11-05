import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';

interface NotificationGroupHeaderProps {
  title: string;
  count: number;
}

export function NotificationGroupHeader({ title, count }: NotificationGroupHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>({count})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.border + '20',
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  count: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});
