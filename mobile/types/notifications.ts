// Notification types for Android NotificationListenerService

export interface NotificationData {
  // Core notification data
  id: string;
  title: string;
  text: string;
  subText?: string;
  packageName: string;
  postTime: number;
  tag?: string;
  
  // Rich metadata
  appName?: string;
  appIcon?: string; // Base64 encoded
  largeText?: string;
  bigPicture?: string; // Base64 encoded
  channelId?: string;
  channelName?: string;
  priority?: number;
  importance?: string; // none|min|low|default|high
  actions?: NotificationAction[];
  groupKey?: string;
  sortKey?: string;
  
  // User interaction flags (from backend)
  isDismissed?: boolean;
  isRead?: boolean;
  isTaskRelevant?: boolean;
  isIgnored?: boolean;
}

export interface NotificationAction {
  title: string;
  intent?: string;
}

export interface NotificationListenerStatus {
  enabled: boolean;
}

// Backend notification types
export interface Notification extends NotificationData {
  _id?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  id?: string;
  whitelistedApps: string[];
  blacklistedApps: string[];
  autoSubmitEnabled: boolean;
  retentionDays: number;
  customKeywords: string[];
}

export interface NotificationInsights {
  totalNotifications: number;
  taskRelevantCount: number;
  mostActiveApps: AppNotificationCount[];
  notificationsByHour: TimeSlotCount[];
  notificationsByDay: DayOfWeekCount[];
}

export interface AppNotificationCount {
  packageName: string;
  appName?: string;
  count: number;
}

export interface TimeSlotCount {
  hour: number;
  count: number;
}

export interface DayOfWeekCount {
  dayOfWeek: number;
  dayName: string;
  count: number;
}
