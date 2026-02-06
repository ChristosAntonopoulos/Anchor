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
  };
}

/**
 * Transforms DisciplineEntryDto to DisciplineEntry
 * Maps only fields needed by frontend
 */
export function transformDisciplineEntry(dto: any): any {
  return {
    gym: dto.gym || false,
    walk: dto.walk || false,
    cooked: dto.cooked || false,
    diet: dto.diet || false,
    meditation: dto.meditation || false,
    water: dto.water || false,
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
