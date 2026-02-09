import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/designTokens';
import { NotificationItem } from './NotificationItem';
import { NotificationGroupHeader } from './NotificationGroupHeader';
import type { Notification } from '../../types';

interface NotificationListProps {
  notifications: Notification[];
  refreshing?: boolean;
  onRefresh?: () => void;
  groupBy?: string;
}

export function NotificationList({ notifications, refreshing, onRefresh, groupBy = 'none' }: NotificationListProps) {
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No notifications yet.</Text>
      </View>
    );
  }

  const handleNotificationPress = (notification: Notification) => {
    router.push(`/more/notifications/${notification.id}`);
  };

  if (groupBy === 'app') {
    // Group by app
    const grouped = notifications.reduce((acc, notif) => {
      const key = notif.packageName || 'unknown';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notif);
      return acc;
    }, {} as Record<string, Notification[]>);

    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.category.work} />
          ) : undefined
        }
      >
        {Object.entries(grouped).map(([packageName, notifs]) => (
          <View key={packageName}>
            <NotificationGroupHeader title={notifs[0]?.appName || packageName} count={notifs.length} />
            {notifs.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  if (groupBy === 'date') {
    // Group by date
    const grouped = notifications.reduce((acc, notif) => {
      const date = new Date(notif.postTime).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(notif);
      return acc;
    }, {} as Record<string, Notification[]>);

    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.category.work} />
          ) : undefined
        }
      >
        {Object.entries(grouped).map(([date, notifs]) => (
          <View key={date}>
            <NotificationGroupHeader title={date} count={notifs.length} />
            {notifs.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  // No grouping - flat list
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.category.work} />
        ) : undefined
      }
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onPress={() => handleNotificationPress(notification)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.m,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
