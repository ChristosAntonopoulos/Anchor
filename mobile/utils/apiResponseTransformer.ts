// Response transformer utilities
// Handles conversion between backend ApiResponse<T> format and frontend expected formats

import type {
  AiBrief,
  Category,
  DietEntry,
  DisciplineEntry,
  ScheduleBlock,
  Task,
  WeeklyReview,
  YesterdayAssessment,
} from '../types';

// Backend API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ErrorDetail[];
  timestamp: string;
}

export interface ErrorDetail {
  field: string;
  message: string;
  code?: string;
}

// Raw DTO shapes from the backend (before transformation)
interface ScheduleBlockDto {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  [key: string]: unknown;
}

interface TaskDto {
  id: string;
  title: string;
  category: Category;
  completed: boolean;
  [key: string]: unknown;
}

interface DisciplineEntryDto {
  gym?: boolean;
  walk?: boolean;
  cooked?: boolean;
  diet?: boolean;
  meditation?: boolean;
  water?: boolean;
  [key: string]: unknown;
}

interface DietEntryDto {
  compliant?: boolean;
  note?: string;
  photoUri?: string;
  [key: string]: unknown;
}

interface WeeklyReviewDto {
  aiSummary?: string;
  completed?: boolean;
  [key: string]: unknown;
}

interface YesterdayAssessmentDto {
  summary?: string;
  wins?: string[];
  misses?: string[];
  carryForward?: string[];
  moodNote?: string;
  dietNote?: string;
  generatedAt?: string;
  [key: string]: unknown;
}

interface AiBriefDto {
  id: string;
  date: string;
  focusCategory?: Category;
  applied?: boolean;
  yesterdayAssessment?: YesterdayAssessmentDto;
  todayFocusTasks?: string[];
  [key: string]: unknown;
}

/**
 * Unwraps the data from backend ApiResponse wrapper.
 * Throws if the response is not successful or data is absent.
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    const errorMessage = response.message || 'API request failed';
    const errorDetails = response.errors?.map(e => `${e.field}: ${e.message}`).join(', ') || '';
    throw new Error(errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage);
  }

  if (response.data === undefined || response.data === null) {
    throw new Error(response.message || 'No data returned from API');
  }

  return response.data;
}

/**
 * Handles API error response and converts to Error
 */
export function handleApiError(response: ApiResponse<unknown>): Error {
  const message = response.message || 'API request failed';
  const errorDetails = response.errors?.map(e => `${e.field}: ${e.message}`).join(', ') || '';
  return new Error(errorDetails ? `${message} (${errorDetails})` : message);
}

/**
 * Transforms ScheduleBlockInstanceDto to ScheduleBlock
 */
export function transformScheduleBlock(dto: ScheduleBlockDto): ScheduleBlock {
  return {
    id: dto.id,
    title: dto.title,
    startTime: dto.startTime,
    endTime: dto.endTime,
    routineActivities: dto.routineActivities,
    taskId: dto.taskId,
    taskTitle: dto.taskTitle,
    entryAction: dto.entryAction,
    startMinutes: dto.startMinutes,
    windowKind: dto.windowKind,
    manualCue: dto.manualCue,
    routineVersion: dto.routineVersion,
    skipped: dto.skipped,
    shorterRoutineActivities: dto.shorterRoutineActivities,
    isRoutine: dto.isRoutine,
    checklistItems: (dto.checklistItems || []).map((item: any, index: number) => {
      const rawMinutes = Number(item.durationMinutes);
      const durationMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 5;
      return {
        id: item.id || `step-${index}`,
        title: item.title || 'Step',
        durationMinutes,
        completed: Boolean(item.completed),
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
      };
    }),
  };
}

/**
 * Transforms TaskDto to Task
 */
export function transformTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    category: dto.category,
    completed: dto.completed,
    status: dto.status,
    focusRank: dto.focusRank,
    plannedDate: dto.plannedDate,
    snoozedUntil: dto.snoozedUntil,
    aiInputId: dto.aiInputId,
    source: dto.source,
    notes: dto.notes,
    privateNotes: dto.privateNotes,
    subtasks: dto.subtasks,
    location: dto.location,
    dueDate: dto.dueDate,
    priority: dto.priority,
    recurrence: dto.recurrence,
    tags: dto.tags,
    estimatedMinutes: dto.estimatedMinutes,
    reminders: dto.reminders,
    completedAt: dto.completedAt,
    order: dto.order,
    nextAction: dto.nextAction,
    upcomingSteps: dto.upcomingSteps,
    definitionOfDone: dto.definitionOfDone,
    dependencies: dto.dependencies,
    returnPoint: dto.returnPoint,
    pendingSuggestion: dto.pendingSuggestion,
  };
}

/**
 * Transforms DisciplineEntryDto to DisciplineEntry
 * Maps block-based structure
 */
export function transformDisciplineEntry(dto: DisciplineEntryDto): DisciplineEntry {
  return {
    gym: dto.gym ?? false,
    walk: dto.walk ?? false,
    cooked: dto.cooked ?? false,
    diet: dto.diet ?? false,
    meditation: dto.meditation ?? false,
    water: dto.water ?? false,
    blocks: dto.blocks || [],
    note: dto.note,
    date: dto.date,
  };
}

/**
 * Transforms DietEntryDto to DietEntry
 */
export function transformDietEntry(dto: DietEntryDto): DietEntry {
  return {
    compliant: dto.compliant ?? false,
    note: dto.note,
    photoUri: dto.photoUri,
  };
}

/**
 * Transforms WeeklyReviewDto to WeeklyReview
 */
export function transformWeeklyReview(dto: WeeklyReviewDto): WeeklyReview {
  return {
    aiSummary: dto.aiSummary ?? '',
    completed: dto.completed ?? false,
  };
}

/**
 * Transforms AiBriefDto to AiBrief
 */
export function transformAiBrief(dto: AiBriefDto): AiBrief {
  let assessment: YesterdayAssessment | undefined;
  if (dto.yesterdayAssessment) {
    const a = dto.yesterdayAssessment;
    assessment = {
      summary: a.summary,
      wins: a.wins ?? [],
      misses: a.misses ?? [],
      carryForward: a.carryForward ?? [],
      moodNote: a.moodNote,
      dietNote: a.dietNote,
      generatedAt: a.generatedAt,
    };
  }
  return {
    id: dto.id,
    date: dto.date,
    focusCategory: dto.focusCategory,
    applied: dto.applied ?? false,
    yesterdayAssessment: assessment,
    todayFocusTasks: dto.todayFocusTasks ?? [],
  };
}
