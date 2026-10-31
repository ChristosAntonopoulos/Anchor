import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const displayText = notification.largeText || notification.text;
  const appName = notification.appName || notification.packageName;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, notification.isRead && styles.readContainer]}
      >
        <View style={styles.content}>
          {notification.appIcon ? (
            <Image
              source={{ uri: `data:image/png;base64,${notification.appIcon}` }}
              style={styles.appIcon}
            />
          ) : (
            <View style={styles.appIconPlaceholder}>
              <AppIcon name="apps-outline" size={20} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.textContainer}>
            <View style={styles.header}>
              <Text style={styles.appName} numberOfLines={1}>
                {appName}
              </Text>
              {notification.isTaskRelevant && (
                <View style={styles.taskRelevantBadge}>
                  <AppIcon name="star" size={12} color={colors.category.work} />
                </View>
              )}
              {notification.isRead && (
                <AppIcon name="checkmark-circle" size={16} color={colors.textSecondary} />
              )}
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>

            {displayText && (
              <Text style={styles.text} numberOfLines={2}>
                {displayText}
              </Text>
            )}

            <Text style={styles.time}>
              {new Date(notification.postTime).toLocaleString()}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.xs,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  readContainer: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.small,
    marginRight: spacing.m,
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.small,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  appName: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    flex: 1,
  },
  taskRelevantBadge: {
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    opacity: 0.6,
  },
});
