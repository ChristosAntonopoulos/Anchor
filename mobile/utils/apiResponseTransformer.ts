// Response transformer utilities
// Handles conversion between backend ApiResponse<T> format and frontend expected formats

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

/**
 * Unwraps the data from backend ApiResponse wrapper
 * Throws error if response is not successful
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
export function handleApiError(response: ApiResponse<any>): Error {
  const message = response.message || 'API request failed';
  const errorDetails = response.errors?.map(e => `${e.field}: ${e.message}`).join(', ') || '';
  return new Error(errorDetails ? `${message} (${errorDetails})` : message);
}

/**
 * Transforms ScheduleBlockInstanceDto to ScheduleBlock
 * Maps only fields needed by frontend
 */
export function transformScheduleBlock(dto: any): any {
  return {
    id: dto.id,
    title: dto.title,
    startTime: dto.startTime,
    endTime: dto.endTime,
    routineActivities: dto.routineActivities,
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
 * Maps only fields needed by frontend
 */
export function transformTask(dto: any): any {
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
  };
}

/**
 * Transforms DisciplineEntryDto to DisciplineEntry
 * Maps block-based structure
 */
export function transformDisciplineEntry(dto: any): any {
  return {
    blocks: dto.blocks || [],
    note: dto.note,
    date: dto.date,
  };
}

/**
 * Transforms DietEntryDto to DietEntry
 * Maps only fields needed by frontend
 */
export function transformDietEntry(dto: any): any {
  return {
    compliant: dto.compliant || false,
    note: dto.note,
    photoUri: dto.photoUri,
  };
}

/**
 * Transforms WeeklyReviewDto to WeeklyReview
 * Maps only fields needed by frontend
 */
export function transformWeeklyReview(dto: any): any {
  return {
    aiSummary: dto.aiSummary || '',
    completed: dto.completed || false,
  };
}
