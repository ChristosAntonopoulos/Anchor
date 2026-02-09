// Type definitions matching the specification's JSON response formats exactly

// Category interface (database-driven)
export interface Category {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon?: string;
  description?: string;
  order: number;
  isActive: boolean;
}

// Legacy category type for backward compatibility (category name/id as string)
export type CategoryName = string;

// Re-export notification types
export type {
  NotificationData,
  Notification,
  NotificationAction,
  NotificationSettings,
  NotificationInsights,
  AppNotificationCount,
  TimeSlotCount,
  DayOfWeekCount,
} from './notifications';

// CBT Types
export interface AutomaticThought {
  text: string;
  emotion?: string;
  intensity?: number; // 0-10
  distortions?: string[];
}

export interface CBTEntry {
  id: string;
  text: string;
  mood?: string;
  moodIntensity?: number; // 0-10
  situation?: string;
  automaticThoughts?: AutomaticThought[];
  cognitiveDistortions?: string[];
  evidenceFor?: string[];
  evidenceAgainst?: string[];
  alternativeThoughts?: string[];
  behaviors?: string[];
  outcome?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string; // ISO datetime string
  aiInsights?: string;
  createdAt: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface MoodEntry {
  id: string;
  date: string; // ISO date string
  mood: string;
  intensity: number; // 0-10
  notes?: string;
  triggers?: string[];
  activities?: string[];
  createdAt: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface BehavioralActivity {
  id: string;
  title: string;
  description?: string;
  scheduledDate?: string; // ISO datetime string
  completedDate?: string; // ISO datetime string
  moodBefore?: number; // 0-10
  moodAfter?: number; // 0-10
  pleasureRating?: number; // 0-10
  masteryRating?: number; // 0-10
  notes?: string;
  isCompleted: boolean;
  createdAt: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface CreateCBTEntryRequest {
  text: string;
}

export interface UpdateCBTEntryRequest {
  situation?: string;
  automaticThoughts?: AutomaticThought[];
  evidenceFor?: string[];
  evidenceAgainst?: string[];
  alternativeThoughts?: string[];
  outcome?: string;
}

export interface CreateMoodEntryRequest {
  date: string; // ISO date string
  mood: string;
  intensity: number; // 0-10
  notes?: string;
  triggers?: string[];
  activities?: string[];
}

export interface CreateBehavioralActivityRequest {
  title: string;
  description?: string;
  scheduledDate?: string; // ISO datetime string
  notes?: string;
}

export interface UpdateBehavioralActivityRequest {
  title?: string;
  description?: string;
  scheduledDate?: string; // ISO datetime string
  notes?: string;
}

export interface CompleteBehavioralActivityRequest {
  moodBefore?: number; // 0-10
  moodAfter?: number; // 0-10
  pleasureRating?: number; // 0-10
  masteryRating?: number; // 0-10
  notes?: string;
}

export type DeadlineStatus = 'on track' | 'behind';

// Day
export interface Day {
  date: string; // ISO date string (YYYY-MM-DD)
}

// BetterItem
export interface BetterItem {
  id: string;
  title: string;
  category: CategoryName; // Category name/id as string
  completed: boolean;
}

// Subtask
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order?: number;
}

// Location
export interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
  placeName?: string;
}

// RecurrencePattern
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number;
  endDate?: string; // ISO date string
  occurrenceCount?: number;
}

// Reminder
export interface Reminder {
  reminderTime: string; // ISO datetime string
  type: 'notification' | 'alarm';
  triggered: boolean;
}

// Task
export interface Task {
  id: string;
  title: string;
  category: CategoryName; // Category name/id as string
  completed: boolean;
  source?: 'ai' | 'user' | 'notification';
  notes?: string;
  privateNotes?: string;
  subtasks?: Subtask[];
  location?: Location;
  dueDate?: string; // ISO datetime string
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  recurrence?: RecurrencePattern;
  tags?: string[];
  estimatedMinutes?: number;
  reminders?: Reminder[];
  completedAt?: string; // ISO datetime string
  order?: number;
}

// DisciplineItemType
export type DisciplineItemType = 'toggle' | 'counter';

// DisciplineItem
export interface DisciplineItem {
  itemId: string;
  itemName: string;
  type: DisciplineItemType;
  toggleValue?: boolean;
  counterValue?: number;
}

// DisciplineBlock
export interface DisciplineBlock {
  blockId: string;
  blockName: string;
  items: DisciplineItem[];
  order?: number;
}

// DisciplineEntry
export interface DisciplineEntry {
  blocks: DisciplineBlock[];
  note?: string;
  date: string;
}

// DietEntry
export interface DietEntry {
  compliant: boolean;
  note?: string;
  photoUri?: string;
}

// ScheduleBlock
export interface ScheduleBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  routineActivities?: string[]; // List of activities for routine blocks
}

// Deadline
export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  status: DeadlineStatus;
  daysLeft?: number; // Calculated field, may be present in some responses
}

// DeadlineWarning (subset of Deadline used in Today response)
export interface DeadlineWarning {
  id: string;
  title: string;
  daysLeft: number;
  status: DeadlineStatus;
}

// IncomeEntry
export interface IncomeEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  source: string;
  amount: number;
}

// MoneySummary
export interface MoneySummary {
  monthlyTotal: number;
  daysSinceLastIncome: number;
  income: IncomeEntry[];
}

// WeeklyReview
export interface WeeklyReview {
  aiSummary: string;
  completed: boolean;
}

// TodayResponse - matches GET /api/today
export interface TodayResponse {
  day: Day;
  betterItems: BetterItem[];
  tasks: Task[];
  discipline: DisciplineEntry;
  diet: DietEntry;
  currentBlock: ScheduleBlock;
  deadlineWarning?: DeadlineWarning;
}

// API Request/Response types for mutations
export interface CompleteBetterItemRequest {
  id: string;
}

export interface AcceptBetterItemRequest {
  id: string;
}

export interface EditBetterItemRequest {
  id: string;
  title: string;
}

export interface RejectBetterItemRequest {
  id: string;
}

export interface UpdateScheduleBlockRequest {
  id: string;
  title?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateTaskRequest {
  title: string;
  category: CategoryName;
  notes?: string;
  privateNotes?: string;
  subtasks?: Subtask[];
  location?: Location;
  dueDate?: string; // ISO datetime string
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  recurrence?: RecurrencePattern;
  tags?: string[];
  estimatedMinutes?: number;
  reminders?: Reminder[];
  order?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  category?: CategoryName;
  completed?: boolean;
  notes?: string;
  privateNotes?: string;
  subtasks?: Subtask[];
  location?: Location;
  dueDate?: string; // ISO datetime string
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  recurrence?: RecurrencePattern;
  tags?: string[];
  estimatedMinutes?: number;
  reminders?: Reminder[];
  order?: number;
}

export interface CompleteTaskRequest {
  id: string;
}

export interface UpdateDisciplineRequest {
  discipline: Partial<DisciplineEntry>;
}

export interface UpdateDietRequest {
  diet: Partial<DietEntry>;
}

export interface CreateIncomeRequest {
  date: string;
  source: string;
  amount: number;
}

export interface SubmitWeeklyReviewRequest {
  shipped: string;
  improved: string;
  avoided: string;
  nextFocus: string;
}
