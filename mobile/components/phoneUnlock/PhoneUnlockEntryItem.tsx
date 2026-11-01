import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { PhoneUnlockEntry } from '../../types';
import { displayUnlockHeadline } from '../../utils/phoneUnlockMapping';

interface PhoneUnlockEntryItemProps {
  entry: PhoneUnlockEntry;
}

export function PhoneUnlockEntryItem({ entry }: PhoneUnlockEntryItemProps) {
  const unlockDate = new Date(entry.unlockedAt);
  const formattedDate = unlockDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = unlockDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <AppIcon name="lock-open-outline" size={20} color={colors.category.stability} />
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.time}>{formattedTime}</Text>
          </View>
        </View>
        <View style={styles.reasonContainer}>
          <Text style={styles.reason}>{displayUnlockHeadline(entry)}</Text>
        </View>
        {entry.unlockMethod && (
          <View style={styles.methodContainer}>
            <Text style={styles.methodText}>Method: {entry.unlockMethod}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    ...shadows.small,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  iconContainer: {
    marginRight: spacing.s,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
  time: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonContainer: {
    marginTop: spacing.xs,
  },
  reason: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.body,
  },
  methodContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  methodText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
