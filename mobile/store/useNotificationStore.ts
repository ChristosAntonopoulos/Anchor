import { create } from 'zustand';
import { Platform } from 'react-native';
import { notificationListener } from '../services/notificationListener';
import { apiClient } from '../services/api';
import type {
  NotificationData,
  Notification,
  NotificationSettings,
  NotificationInsights,
} from '../types/notifications';

interface NotificationStore {
  // State
  isEnabled: boolean;
  notifications: NotificationData[]; // Local cache
  backendNotifications: Notification[]; // From backend
  isListening: boolean;
  settings: NotificationSettings | null;
  insights: NotificationInsights | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  checkStatus: () => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  processNotification: (notification: NotificationData) => Promise<void>;
  syncNotificationToBackend: (notification: NotificationData) => Promise<void>;
  fetchNotifications: (params?: {
    groupBy?: string;
    filter?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsDismissed: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  fetchInsights: (startDate?: string, endDate?: string) => Promise<void>;
  checkAppFilter: (packageName: string) => boolean;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => {
  let unsubscribePosted: (() => void) | null = null;
  let unsubscribeRemoved: (() => void) | null = null;

  return {
    isEnabled: false,
    notifications: [],
    backendNotifications: [],
    isListening: false,
    settings: null,
    insights: null,
    loading: false,
    error: null,

    checkStatus: async () => {
      if (Platform.OS !== 'android') {
        return;
      }

      try {
        const enabled = await notificationListener.isEnabled();
        set({ isEnabled: enabled });
        
        if (enabled && !get().isListening) {
          get().startListening();
        } else if (!enabled && get().isListening) {
          get().stopListening();
        }
      } catch (error) {
        console.error('Error checking notification status:', error);
        set({ error: 'Failed to check notification status' });
      }
    },

    startListening: () => {
      if (Platform.OS !== 'android' || get().isListening) {
        return;
      }

      // Subscribe to notification posted events
      unsubscribePosted = notificationListener.onNotificationPosted(async (notification) => {
        console.log('📱 Notification received:', notification);
        await get().processNotification(notification);
      });

      // Subscribe to notification removed events
      unsubscribeRemoved = notificationListener.onNotificationRemoved((notification) => {
        console.log('📱 Notification removed:', notification);
        // Remove from local cache
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== notification.id),
        }));
      });

      set({ isListening: true });
      console.log('✅ Started listening to notifications');
    },

    stopListening: () => {
      if (unsubscribePosted) {
        unsubscribePosted();
        unsubscribePosted = null;
      }
      if (unsubscribeRemoved) {
        unsubscribeRemoved();
        unsubscribeRemoved = null;
      }
      set({ isListening: false });
      console.log('⏹️ Stopped listening to notifications');
    },

    processNotification: async (notification: NotificationData) => {
      // Filter out notifications from our own app
      if (notification.packageName === 'com.pos.mobile') {
        return;
      }

      // Check app filter (whitelist/blacklist)
      if (!get().checkAppFilter(notification.packageName)) {
        console.log('🚫 Notification filtered out:', notification.packageName);
        return;
      }

      // Add to local cache
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
      }));

      // Check if notification might be task-relevant
      const taskKeywords = [
        'meeting', 'call', 'deadline', 'due', 'reminder', 'task', 'todo',
        'appointment', 'event', 'schedule', 'meet', 'conference', 'zoom',
        'teams', 'calendar', 'email', 'message', 'urgent', 'important'
      ];

      const notificationText = `${notification.title} ${notification.text} ${notification.subText || ''}`.toLowerCase();
      const isTaskRelevant = taskKeywords.some(keyword => notificationText.includes(keyword));

      if (isTaskRelevant) {
        console.log('🎯 Task-relevant notification detected:', notification);
        notification.isTaskRelevant = true;
      }

      // Sync to backend
      await get().syncNotificationToBackend(notification);
    },

    syncNotificationToBackend: async (notification: NotificationData) => {
      try {
        await apiClient.createNotification(notification);
        console.log('✅ Notification synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync notification to backend:', error);
        // Don't throw - allow app to continue even if sync fails
      }
    },

    fetchNotifications: async (params?: {
      groupBy?: string;
      filter?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      set({ loading: true, error: null });
      try {
        const result = await apiClient.getNotifications(params);
        set({
          backendNotifications: result.notifications,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        set({
          error: 'Failed to fetch notifications',
          loading: false,
        });
      }
    },

    markAsRead: async (id: string) => {
      try {
        // API returns updated notification, use it to update state
        const updated = await apiClient.updateNotification(id, { isRead: true });
        set((state) => ({
          backendNotifications: state.backendNotifications.map(n =>
            n.id === id ? updated : n
          ),
        }));
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    },

    markAsDismissed: async (id: string) => {
      try {
        // API returns updated notification, use it to update state
        const updated = await apiClient.updateNotification(id, { isDismissed: true });
        set((state) => ({
          backendNotifications: state.backendNotifications.map(n =>
            n.id === id ? updated : n
          ),
        }));
      } catch (error) {
        console.error('Error dismissing notification:', error);
        throw error;
      }
    },

    deleteNotification: async (id: string) => {
      try {
        await apiClient.deleteNotification(id);
        // Refresh notifications to ensure state matches server
        await get().fetchNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    },

    fetchSettings: async () => {
      try {
        const settings = await apiClient.getNotificationSettings();
        set({ settings });
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        set({ error: 'Failed to fetch notification settings' });
      }
    },

    updateSettings: async (settings: Partial<NotificationSettings>) => {
      try {
        const updated = await apiClient.updateNotificationSettings(settings);
        set({ settings: updated });
      } catch (error) {
        console.error('Error updating notification settings:', error);
        throw error;
      }
    },

    fetchInsights: async (startDate?: string, endDate?: string) => {
      try {
        const insights = await apiClient.getNotificationInsights(startDate, endDate);
        set({ insights });
      } catch (error) {
        console.error('Error fetching notification insights:', error);
        set({ error: 'Failed to fetch notification insights' });
      }
    },

    checkAppFilter: (packageName: string): boolean => {
      const settings = get().settings;
      if (!settings) {
        // If no settings, allow all (will be loaded on first fetch)
        return true;
      }

      // Check blacklist first
      if (settings.blacklistedApps.includes(packageName)) {
        return false;
      }

      // If whitelist is empty, allow all (except blacklisted)
      if (settings.whitelistedApps.length === 0) {
        return true;
      }

      // Check whitelist
      return settings.whitelistedApps.includes(packageName);
    },

    clearNotifications: () => {
      set({ notifications: [], backendNotifications: [] });
    },
  };
});
