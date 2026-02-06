import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/designTokens';

interface TodayHeaderProps {
  date: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function TodayHeader({ date }: TodayHeaderProps) {
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.xs,
    paddingBottom: spacing.s,
  },
  greeting: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});
