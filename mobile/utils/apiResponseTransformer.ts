// Response transformer utilities
// Handles conversion between backend ApiResponse<T> format and frontend expected formats

import type {
  ScheduleBlock,
  Task,
  DisciplineEntry,
  DietEntry,
  WeeklyReview,
  Category,
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
  };
}

/**
 * Transforms DisciplineEntryDto to DisciplineEntry
 */
export function transformDisciplineEntry(dto: DisciplineEntryDto): DisciplineEntry {
  return {
    gym: dto.gym ?? false,
    walk: dto.walk ?? false,
    cooked: dto.cooked ?? false,
    diet: dto.diet ?? false,
    meditation: dto.meditation ?? false,
    water: dto.water ?? false,
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
