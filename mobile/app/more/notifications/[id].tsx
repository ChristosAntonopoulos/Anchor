import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../../components/icons/AppIcon';
import { colors, gradients, spacing, typography, borderRadius, shadows } from '../../../constants/designTokens';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { apiClient } from '../../../services/api';
import { CreateTaskButton } from '../../../components/notifications/CreateTaskButton';

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { markAsRead, markAsDismissed, deleteNotification } = useNotificationStore();
  const [notification, setNotification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotification();
  }, [id]);

  const loadNotification = async () => {
    try {
      setLoading(true);
      const notif = await apiClient.getNotification(id);
      setNotification(notif);
      if (!notif.isRead) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error('Error loading notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await markAsDismissed(id);
      router.back();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotification(id);
      router.back();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.category.work} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!notification) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Notification not found</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const displayText = notification.largeText || notification.text;
  const appName = notification.appName || notification.packageName;

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {notification.appIcon ? (
              <Image
                source={{ uri: `data:image/png;base64,${notification.appIcon}` }}
                style={styles.appIcon}
              />
            ) : (
              <View style={styles.appIconPlaceholder}>
                <AppIcon name="apps-outline" size={24} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.appName}>{appName}</Text>
              <Text style={styles.packageName}>{notification.packageName}</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#1E2530', '#252B38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contentCard}
          >
            <Text style={styles.title}>{notification.title}</Text>
            {displayText && <Text style={styles.text}>{displayText}</Text>}
            {notification.subText && <Text style={styles.subText}>{notification.subText}</Text>}

            {notification.bigPicture && (
              <Image
                source={{ uri: `data:image/png;base64,${notification.bigPicture}` }}
                style={styles.bigPicture}
                resizeMode="cover"
              />
            )}
          </LinearGradient>

          <View style={styles.metadataSection}>
            <Text style={styles.sectionTitle}>Metadata</Text>
            {notification.channelName && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Channel:</Text>
                <Text style={styles.metadataValue}>{notification.channelName}</Text>
              </View>
            )}
            {notification.importance && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Importance:</Text>
                <Text style={styles.metadataValue}>{notification.importance}</Text>
              </View>
            )}
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Time:</Text>
              <Text style={styles.metadataValue}>{new Date(notification.postTime).toLocaleString()}</Text>
            </View>
          </View>

          {notification.actions && notification.actions.length > 0 && (
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Actions</Text>
              {notification.actions.map((action: any, index: number) => (
                <TouchableOpacity key={index} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.quickActions}>
            <CreateTaskButton notification={notification} />
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleDismiss}>
              <AppIcon name="checkmark-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.actionButtonTextSecondary}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleDelete}>
              <AppIcon name="trash-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.actionButtonTextSecondary}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.small,
    marginRight: spacing.m,
  },
  appIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.small,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  packageName: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  contentCard: {
    margin: spacing.m,
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  text: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.m,
    lineHeight: 22,
  },
  subText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  bigPicture: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.small,
    marginTop: spacing.m,
  },
  metadataSection: {
    padding: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  metadataLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    width: 100,
  },
  metadataValue: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  actionsSection: {
    padding: spacing.m,
  },
  actionButton: {
    padding: spacing.m,
    backgroundColor: '#1E2530',
    borderRadius: borderRadius.small,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  quickActions: {
    padding: spacing.m,
    gap: spacing.m,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: '#1E2530',
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s,
  },
  actionButtonTextSecondary: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
});
