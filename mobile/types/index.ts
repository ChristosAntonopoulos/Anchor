// Type definitions matching the specification's JSON response formats exactly

export type Category = 'work' | 'leverage' | 'health' | 'stability';

export type DeadlineStatus = 'on track' | 'behind';

// Day
export interface Day {
  date: string; // ISO date string (YYYY-MM-DD)
}

// BetterItem
export interface BetterItem {
  id: string;
  title: string;
  category: Category;
  completed: boolean;
}

// Task
export interface Task {
  id: string;
  title: string;
  category: Category;
  completed: boolean;
}

// DisciplineEntry
export interface DisciplineEntry {
  gym: boolean;
  walk: boolean;
  cooked: boolean;
  diet: boolean;
  meditation: boolean;
  water: boolean;
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
  category: Category;
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
