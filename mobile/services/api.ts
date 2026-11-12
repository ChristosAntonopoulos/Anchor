// API client with HTTP implementation
// Connects to backend API
import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  TodayResponse,
  ScheduleBlock,
  Deadline,
  CreateDeadlineRequest,
  UpdateDeadlineRequest,
  MoneySummary,
  CreateWalletSpendRequest,
  WalletSpend,
  WeeklyReview,
  Category,
  CompleteBetterItemRequest,
  AcceptBetterItemRequest,
  EditBetterItemRequest,
  RejectBetterItemRequest,
  UpdateScheduleBlockRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  UpdateDisciplineRequest,
  UpdateDietRequest,
  CreateIncomeRequest,
  SubmitWeeklyReviewRequest,
  Notification,
  NotificationData,
  NotificationSettings,
  NotificationInsights,
  AppNotificationCount,
  DisciplineEntry,
  CreatePhoneUnlockEntryRequest,
  PhoneUnlockEntry,
  AIInput,
  CBTEntry,
  MoodEntry,
  BehavioralActivity,
  CreateCBTEntryRequest,
  UpdateCBTEntryRequest,
  CreateMoodEntryRequest,
  CreateBehavioralActivityRequest,
  UpdateBehavioralActivityRequest,
  CompleteBehavioralActivityRequest,
  ActivityTemplate,
  CheckInAssistRequest,
  CheckInAssistResponse,
  CreateActivityAttemptRequest,
  LinkActivityTaskResponse,
  ProblemSolvingRecord,
  Task,
  TaskInboxResponse,
  DayBootstrap,
  ExecutionProfile,
  WorkSession,
  NowRecommendation,
  StuckHelp,
  DayPlan,
} from '../types';
import type {
  AdaptRoutine,
  CapacityChoice,
  ReturnPointDraft,
} from '../types/execution';
import { API_CONFIG, getApiUrl } from '../constants/apiConfig';
import {
  unwrapResponse,
  transformAiBrief,
  transformDietEntry,
  transformDisciplineEntry,
  transformScheduleBlock,
  transformTask,
  transformWeeklyReview,
  type ApiResponse,
} from '../utils/apiResponseTransformer';

// API Client Interface
export interface APIClient {
  // GET endpoints
  getToday(): Promise<TodayResponse>;
  getDayBootstrapStatus(): Promise<DayBootstrap>;
  markDayAssessmentSeen(): Promise<void>;
  getSchedule(): Promise<ScheduleBlock[]>;
  getDeadlines(): Promise<Deadline[]>;
  createDeadline(request: CreateDeadlineRequest): Promise<Deadline>;
  updateDeadline(id: string, request: UpdateDeadlineRequest): Promise<Deadline>;
  deleteDeadline(id: string): Promise<void>;
  getMoneySummary(): Promise<MoneySummary>;
  getWeeklyReview(): Promise<WeeklyReview>;
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category>;
  
  // CBT endpoints
  submitCBTEntry(text: string): Promise<CBTEntry>;
  getCBTEntries(date?: string): Promise<CBTEntry[]>;
  getCBTEntry(id: string): Promise<CBTEntry>;
  updateCBTEntry(id: string, request: UpdateCBTEntryRequest): Promise<void>;
  deleteCBTEntry(id: string): Promise<void>;
  getMoodEntries(startDate: string, endDate: string): Promise<MoodEntry[]>;
  createMoodEntry(request: CreateMoodEntryRequest): Promise<void>;
  getBehavioralActivities(date?: string): Promise<BehavioralActivity[]>;
  createBehavioralActivity(request: CreateBehavioralActivityRequest): Promise<void>;
  updateBehavioralActivity(id: string, request: UpdateBehavioralActivityRequest): Promise<void>;
  completeBehavioralActivity(id: string, request: CompleteBehavioralActivityRequest): Promise<void>;
  createCheckIn(request: CreateCBTEntryRequest): Promise<CBTEntry>;
  listCheckIns(params?: { from?: string; to?: string; state?: string; type?: string }): Promise<CBTEntry[]>;
  getCheckIn(id: string): Promise<CBTEntry>;
  updateCheckIn(id: string, request: UpdateCBTEntryRequest): Promise<CBTEntry>;
  deleteCheckIn(id: string): Promise<void>;
  assistCheckIn(id: string, request?: CheckInAssistRequest): Promise<CheckInAssistResponse>;
  saveThoughtRecord(id: string, request: UpdateCBTEntryRequest): Promise<CBTEntry>;
  saveProblemSolving(id: string, record: ProblemSolvingRecord): Promise<CBTEntry>;
  getActivityTemplates(): Promise<ActivityTemplate[]>;
  listActivityPlans(checkInId?: string): Promise<BehavioralActivity[]>;
  createActivityPlan(request: CreateBehavioralActivityRequest): Promise<BehavioralActivity>;
  updateActivityPlan(id: string, request: UpdateBehavioralActivityRequest): Promise<BehavioralActivity>;
  recordActivityAttempt(id: string, request: CreateActivityAttemptRequest): Promise<BehavioralActivity>;
  linkActivityTask(id: string): Promise<LinkActivityTaskResponse>;
  
  // POST endpoints
  completeBetterItem(request: CompleteBetterItemRequest): Promise<void>;
  acceptBetterItem(request: AcceptBetterItemRequest): Promise<void>;
  editBetterItem(request: EditBetterItemRequest): Promise<void>;
  rejectBetterItem(request: RejectBetterItemRequest): Promise<void>;
  updateScheduleBlock(request: UpdateScheduleBlockRequest): Promise<void>;
  updateScheduleChecklistItem(blockId: string, itemId: string, completed: boolean): Promise<void>;
  createTask(request: CreateTaskRequest): Promise<Task>;
  getExecutionProfile(): Promise<ExecutionProfile>;
  updateExecutionProfile(request: Partial<ExecutionProfile>): Promise<ExecutionProfile>;
  getNowRecommendation(params?: { capacity?: CapacityChoice; easier?: boolean; refresh?: boolean }): Promise<NowRecommendation>;
  rejectNowSuggestion(taskId?: string | null): Promise<void>;
  getActiveSession(): Promise<WorkSession | null>;
  startSession(request: { taskId?: string; blockId?: string; minutes?: number; timerEnabled?: boolean; currentAction?: string }): Promise<WorkSession>;
  pauseSession(id: string): Promise<WorkSession>;
  resumeSession(id: string): Promise<WorkSession>;
  timeCheckSession(id: string): Promise<WorkSession>;
  captureDistraction(id: string, text: string): Promise<WorkSession>;
  finishSession(id: string, request: { outcome?: string; returnPoint?: string; notes?: string }): Promise<WorkSession>;
  planTask(id: string): Promise<Task>;
  acceptTaskPlan(id: string, request?: { edit?: boolean; nextActionText?: string; estimatedMinutes?: number }): Promise<Task>;
  helpStuck(request: { taskId?: string; sessionId?: string; explanation?: string; choice?: string; makeSmaller?: boolean }): Promise<StuckHelp>;
  acceptStuck(request: { sessionId?: string; taskId?: string; suggestedAction: string; suggestedMinutes?: number | null }): Promise<Task>;
  planDay(request?: { scope?: 'today' | 'remaining'; capacity?: string }): Promise<DayPlan>;
  applyDayPlan(draftId: string, mode: 'all' | 'first' | 'discard'): Promise<DayPlan>;
  recoveryAction(request: { action: 'shorter' | 'move' | 'leave' | 'replan'; blockId?: string; taskId?: string }): Promise<NowRecommendation>;
  draftReturnPoint(sessionId: string, notes?: string): Promise<ReturnPointDraft>;
  adaptRoutine(request: { definitionId?: string; blockId?: string; capacity?: string }): Promise<AdaptRoutine>;
  setRoutineVersion(blockId: string, version: 'regular' | 'shorter'): Promise<void>;
  skipRoutine(blockId: string): Promise<void>;
  getExecutionReview(): Promise<import('../types/execution').ExecutionReview>;
  syncMorningSession(session: import('../utils/morningMode').MorningSession): Promise<void>;
  getMorningFirstTask(): Promise<import('../utils/morningMode').MorningFirstTask>;
  helpMorning(request: { step: string; text: string }): Promise<string | null>;
  getTodayFocus(): Promise<Task[]>;
  getInbox(limit?: number): Promise<TaskInboxResponse>;
  promoteTask(id: string): Promise<Task>;
  demoteTask(id: string): Promise<Task>;
  updateTask(id: string, request: UpdateTaskRequest): Promise<void>;
  completeTask(request: CompleteTaskRequest): Promise<void>;
  getTasksNearby(latitude: number, longitude: number, radiusKm?: number): Promise<Task[]>;
  updateDiscipline(request: UpdateDisciplineRequest): Promise<void>;
  updateDisciplineToggle(date: string, blockId: string, itemId: string, value: boolean): Promise<DisciplineEntry>;
  incrementDisciplineCounter(date: string, blockId: string, itemId: string): Promise<DisciplineEntry>;
  decrementDisciplineCounter(date: string, blockId: string, itemId: string): Promise<DisciplineEntry>;
  setDisciplineCounter(date: string, blockId: string, itemId: string, value: number): Promise<DisciplineEntry>;
  updateDiet(request: UpdateDietRequest): Promise<void>;
  createIncome(request: CreateIncomeRequest): Promise<void>;
  createWalletSpend(request: CreateWalletSpendRequest): Promise<WalletSpend>;
  submitWeeklyReview(request: SubmitWeeklyReviewRequest): Promise<void>;
  markAiBriefApplied(): Promise<void>;
  submitAIInput(text: string): Promise<AIInput>;
  getAIInput(id: string): Promise<AIInput>;
  
  // Notification endpoints
  createNotification(notification: NotificationData): Promise<Notification>;
  getNotifications(params?: {
    groupBy?: string;
    filter?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: Notification[]; totalCount: number; page: number; limit: number; totalPages: number }>;
  getNotification(id: string): Promise<Notification>;
  updateNotification(id: string, updates: { isDismissed?: boolean; isRead?: boolean; isIgnored?: boolean }): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
  getNotificationInsights(startDate?: string, endDate?: string): Promise<NotificationInsights>;
  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings>;
  getNotificationApps(): Promise<AppNotificationCount[]>;
  
  // Phone Unlock endpoints
  createPhoneUnlockEntry(request: CreatePhoneUnlockEntryRequest): Promise<void>;
  getPhoneUnlockEntries(startDate?: string, endDate?: string): Promise<PhoneUnlockEntry[]>;

  // Home launcher — org-wide Azure DevOps latest pipeline
  getLatestPipeline(): Promise<import('../types').LatestPipelineRun>;
}

// HTTP API Client Implementation
class HTTPAPIClient implements APIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (__DEV__) {
          console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
          console.log('🌐 Base URL:', config.baseURL);
        }
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('✅ API Response:', response.status, response.config.url);
        }
        return response;
      },
      (error: AxiosError) => {
        // Log detailed error information
        console.error('❌ API Error:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          code: error.code,
          message: error.message,
          data: error.response?.data,
        });

        if (error.response?.data) {
          // Try to extract error from ApiResponse format
          const apiResponse = error.response.data as ApiResponse<any>;
          if (apiResponse && typeof apiResponse === 'object' && 'success' in apiResponse) {
            throw new Error(apiResponse.message || 'API request failed');
          }
        }
        
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your connection.');
        }
        
        if (error.code === 'ERR_NETWORK') {
          const baseURL = error.config?.baseURL || API_CONFIG.baseURL;
          throw new Error(`Network error. Cannot reach backend at ${baseURL}. Please check your connection and ensure the backend is running.`);
        }

        // Handle HTTP errors
        if (error.response) {
          const status = error.response.status;
          const message = (error.response.data as any)?.message || `HTTP ${status} error`;
          throw new Error(message);
        }

        throw error;
      }
    );
  }

  async getToday(): Promise<TodayResponse> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<TodayResponse>>('/today');
      const data = unwrapResponse(response.data);
      
      // Transform response to match frontend types
      return {
        day: data.day,
        dayBootstrap: data.dayBootstrap,
        betterItems: data.betterItems || [],
        tasks: (data.tasks || []).map(transformTask),
        discipline: transformDisciplineEntry(data.discipline || {}),
        diet: transformDietEntry(data.diet || {}),
        currentBlock: data.currentBlock ? {
          id: data.currentBlock.id,
          title: data.currentBlock.title,
          startTime: data.currentBlock.startTime,
          endTime: data.currentBlock.endTime,
          routineActivities: data.currentBlock.routineActivities,
          checklistItems: data.currentBlock.checklistItems,
        } : {
          id: '',
          title: '',
          startTime: '',
          endTime: '',
        },
        deadlineWarning: data.deadlineWarning,
        aiBrief: data.aiBrief ? transformAiBrief(data.aiBrief as any) : undefined,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch today\'s data');
    }
  }

  async getDayBootstrapStatus(): Promise<DayBootstrap> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<DayBootstrap>>('/day/bootstrap-status');
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch day bootstrap status');
    }
  }

  async markDayAssessmentSeen(): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/day/assessment-seen');
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to mark assessment seen');
    }
  }

  async getSchedule(): Promise<ScheduleBlock[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ScheduleBlock[]>>('/schedule');
      const data = unwrapResponse(response.data);
      
      // Transform ScheduleBlockInstanceDto[] to ScheduleBlock[]
      return (data || []).map(transformScheduleBlock);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch schedule');
    }
  }

  async getDeadlines(): Promise<Deadline[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Deadline[]>>('/deadlines');
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch deadlines');
    }
  }

  async createDeadline(request: CreateDeadlineRequest): Promise<Deadline> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<Deadline>>('/deadlines', request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create deadline');
    }
  }

  async updateDeadline(id: string, request: UpdateDeadlineRequest): Promise<Deadline> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<Deadline>>(`/deadlines/${id}`, {
        ...request,
        id,
      });
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update deadline');
    }
  }

  async deleteDeadline(id: string): Promise<void> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<unknown>>(`/deadlines/${id}`);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete deadline');
    }
  }

  async getMoneySummary(): Promise<MoneySummary> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<MoneySummary>>('/money/summary');
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch money summary');
    }
  }

  async getWeeklyReview(): Promise<WeeklyReview> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<WeeklyReview>>('/weekly-review');
      const data = unwrapResponse(response.data);
      return transformWeeklyReview(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch weekly review');
    }
  }

  async completeBetterItem(request: CompleteBetterItemRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/better-items/complete', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to complete better item');
    }
  }

  async acceptBetterItem(request: AcceptBetterItemRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/better-items/accept', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to accept better item');
    }
  }

  async editBetterItem(request: EditBetterItemRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/better-items/edit', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to edit better item');
    }
  }

  async rejectBetterItem(request: RejectBetterItemRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/better-items/reject', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to reject better item');
    }
  }

  async updateScheduleBlock(request: UpdateScheduleBlockRequest): Promise<void> {
    try {
      // Backend expects id in both URL and body
      const response = await this.axiosInstance.put<ApiResponse<void>>(
        `/schedule/${request.id}`,
        request
      );
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update schedule block');
    }
  }

  async updateScheduleChecklistItem(blockId: string, itemId: string, completed: boolean): Promise<void> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<void>>(
        `/schedule/${blockId}/checklist/${itemId}`,
        { completed }
      );
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update checklist item');
    }
  }

  async createTask(request: CreateTaskRequest): Promise<Task> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<Task>>('/tasks', request);
      return transformTask(unwrapResponse(response.data));
    } catch (error) {
      throw this.handleError(error, 'Failed to create task');
    }
  }

  async getTodayFocus(): Promise<Task[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Task[]>>('/tasks/today');
      const data = unwrapResponse(response.data);
      return (data || []).map(transformTask);
    } catch (error) {
      throw this.handleError(error, 'Failed to get today focus tasks');
    }
  }

  async getInbox(limit: number = 50): Promise<TaskInboxResponse> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<TaskInboxResponse>>(
        `/tasks/inbox?limit=${limit}`
      );
      const data = unwrapResponse(response.data);
      return {
        items: (data.items || []).map(transformTask),
        totalCount: data.totalCount ?? 0,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get inbox tasks');
    }
  }

  async promoteTask(id: string): Promise<Task> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<Task>>(`/tasks/${id}/promote`);
      const data = unwrapResponse(response.data);
      return transformTask(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to promote task');
    }
  }

  async demoteTask(id: string): Promise<Task> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<Task>>(`/tasks/${id}/demote`);
      const data = unwrapResponse(response.data);
      return transformTask(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to demote task');
    }
  }

  async updateTask(id: string, request: UpdateTaskRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<void>>(`/tasks/${id}`, request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update task');
    }
  }

  async getTasksNearby(latitude: number, longitude: number, radiusKm: number = 5.0): Promise<Task[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Task[]>>(
        `/tasks/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
      );
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get nearby tasks');
    }
  }

  async completeTask(request: CompleteTaskRequest): Promise<void> {
    try {
      // Backend expects id in both URL and body
      const response = await this.axiosInstance.post<ApiResponse<void>>(
        `/tasks/${request.id}/complete`,
        { id: request.id }
      );
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to complete task');
    }
  }

  async updateDiscipline(request: UpdateDisciplineRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<void>>('/discipline', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update discipline');
    }
  }

  async updateDisciplineToggle(date: string, blockId: string, itemId: string, value: boolean): Promise<DisciplineEntry> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<any>>(
        `/discipline/${date}/block/${blockId}/item/${itemId}/toggle`,
        value
      );
      const data = unwrapResponse(response.data);
      return transformDisciplineEntry(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update discipline toggle');
    }
  }

  async incrementDisciplineCounter(date: string, blockId: string, itemId: string): Promise<DisciplineEntry> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<any>>(
        `/discipline/${date}/block/${blockId}/item/${itemId}/increment`
      );
      const data = unwrapResponse(response.data);
      return transformDisciplineEntry(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to increment discipline counter');
    }
  }

  async decrementDisciplineCounter(date: string, blockId: string, itemId: string): Promise<DisciplineEntry> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<any>>(
        `/discipline/${date}/block/${blockId}/item/${itemId}/decrement`
      );
      const data = unwrapResponse(response.data);
      return transformDisciplineEntry(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to decrement discipline counter');
    }
  }

  async setDisciplineCounter(date: string, blockId: string, itemId: string, value: number): Promise<DisciplineEntry> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<any>>(
        `/discipline/${date}/block/${blockId}/item/${itemId}/set`,
        value
      );
      const data = unwrapResponse(response.data);
      return transformDisciplineEntry(data);
    } catch (error) {
      throw this.handleError(error, 'Failed to set discipline counter');
    }
  }

  async updateDiet(request: UpdateDietRequest): Promise<void> {
    try {
      // Transform: { diet: {...} } → { compliant?, photoUri?, note? }
      const backendRequest = request.diet;
      const response = await this.axiosInstance.put<ApiResponse<void>>('/diet', backendRequest);
      unwrapResponse(response.data);
      // Ignore returned DietEntryDto, frontend expects void
    } catch (error) {
      throw this.handleError(error, 'Failed to update diet');
    }
  }

  async createIncome(request: CreateIncomeRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<any>>('/money/income', request);
      unwrapResponse(response.data);
      // Ignore returned IncomeEntryDto, frontend expects void
    } catch (error) {
      throw this.handleError(error, 'Failed to create income entry');
    }
  }

  async createWalletSpend(request: CreateWalletSpendRequest): Promise<WalletSpend> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<WalletSpend>>('/money/spend', request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to record Google Wallet payment');
    }
  }

  async submitWeeklyReview(request: SubmitWeeklyReviewRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<any>>('/weekly-review/submit', request);
      unwrapResponse(response.data);
      // Ignore returned WeeklyReviewDto, frontend expects void
    } catch (error) {
      throw this.handleError(error, 'Failed to submit weekly review');
    }
  }

  async markAiBriefApplied(): Promise<void> {
    try {
      await this.axiosInstance.post<ApiResponse<unknown>>('/ai-brief/applied');
    } catch (error) {
      throw this.handleError(error, 'Failed to mark AI brief as applied');
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Category[]>>('/category');
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get categories');
    }
  }

  async getCategory(id: string): Promise<Category> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Category>>(`/category/${id}`);
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get category');
    }
  }

  async submitAIInput(text: string): Promise<AIInput> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<AIInput>>('/ai-input', { text });
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to submit input for AI processing');
    }
  }

  async getAIInput(id: string): Promise<AIInput> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<AIInput>>(`/ai-input/${encodeURIComponent(id)}`);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to get AI input status');
    }
  }

  async submitCBTEntry(text: string): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<CBTEntry>>('/cbt/entries', { text });
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to submit CBT entry');
    }
  }

  async getCBTEntries(date?: string): Promise<CBTEntry[]> {
    try {
      const url = date ? `/cbt/entries?date=${date}` : '/cbt/entries';
      const response = await this.axiosInstance.get<ApiResponse<CBTEntry[]>>(url);
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get CBT entries');
    }
  }

  async getCBTEntry(id: string): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<CBTEntry>>(`/cbt/entries/${id}`);
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get CBT entry');
    }
  }

  async updateCBTEntry(id: string, request: UpdateCBTEntryRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<void>>(`/cbt/entries/${id}`, request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update CBT entry');
    }
  }

  async deleteCBTEntry(id: string): Promise<void> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<void>>(`/cbt/entries/${id}`);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete CBT entry');
    }
  }

  async getMoodEntries(startDate: string, endDate: string): Promise<MoodEntry[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<MoodEntry[]>>(
        `/cbt/moods?startDate=${startDate}&endDate=${endDate}`
      );
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get mood entries');
    }
  }

  async createMoodEntry(request: CreateMoodEntryRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/cbt/moods', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create mood entry');
    }
  }

  async getBehavioralActivities(date?: string): Promise<BehavioralActivity[]> {
    try {
      const url = date ? `/cbt/activities?date=${date}` : '/cbt/activities';
      const response = await this.axiosInstance.get<ApiResponse<BehavioralActivity[]>>(url);
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get behavioral activities');
    }
  }

  async createBehavioralActivity(request: CreateBehavioralActivityRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/cbt/activities', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create behavioral activity');
    }
  }

  async updateBehavioralActivity(id: string, request: UpdateBehavioralActivityRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<void>>(`/cbt/activities/${id}`, request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update behavioral activity');
    }
  }

  async completeBehavioralActivity(id: string, request: CompleteBehavioralActivityRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>(`/cbt/activities/${id}/complete`, request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to complete behavioral activity');
    }
  }

  // Notification methods
  async createNotification(notification: NotificationData): Promise<Notification> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<Notification>>('/notification', {
        notificationId: notification.id,
        title: notification.title,
        text: notification.text,
        subText: notification.subText,
        packageName: notification.packageName,
        postTime: new Date(notification.postTime).toISOString(),
        tag: notification.tag,
        appName: notification.appName,
        appIcon: notification.appIcon,
        largeText: notification.largeText,
        bigPicture: notification.bigPicture,
        channelId: notification.channelId,
        channelName: notification.channelName,
        priority: notification.priority,
        importance: notification.importance,
        actions: notification.actions,
        groupKey: notification.groupKey,
        sortKey: notification.sortKey,
        isTaskRelevant: notification.isTaskRelevant || false,
      });
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create notification');
    }
  }

  async getNotifications(params?: {
    groupBy?: string;
    filter?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: Notification[]; totalCount: number; page: number; limit: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.groupBy) queryParams.append('groupBy', params.groupBy);
      if (params?.filter) queryParams.append('filter', params.filter);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/notification${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.axiosInstance.get<ApiResponse<{
        notifications: Notification[];
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
      }>>(url);
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get notifications');
    }
  }

  async getNotification(id: string): Promise<Notification> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<Notification>>(`/notification/${id}`);
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get notification');
    }
  }

  async updateNotification(id: string, updates: { isDismissed?: boolean; isRead?: boolean; isIgnored?: boolean }): Promise<Notification> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<Notification>>(`/notification/${id}`, {
        id,
        ...updates,
      });
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update notification');
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<void>>(`/notification/${id}`);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete notification');
    }
  }

  async getNotificationInsights(startDate?: string, endDate?: string): Promise<NotificationInsights> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const url = `/notification/insights${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.axiosInstance.get<ApiResponse<NotificationInsights>>(url);
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get notification insights');
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<NotificationSettings>>('/notification/settings');
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get notification settings');
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<NotificationSettings>>('/notification/settings', settings);
      const data = unwrapResponse(response.data);
      return data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update notification settings');
    }
  }

  async getNotificationApps(): Promise<AppNotificationCount[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<AppNotificationCount[]>>('/notification/apps');
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get notification apps');
    }
  }

  async createCheckIn(request: CreateCBTEntryRequest): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<CBTEntry>>('/check-ins', request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to save check-in');
    }
  }

  async listCheckIns(params?: { from?: string; to?: string; state?: string; type?: string }): Promise<CBTEntry[]> {
    try {
      const query = new URLSearchParams();
      if (params?.from) query.append('from', params.from);
      if (params?.to) query.append('to', params.to);
      if (params?.state) query.append('state', params.state);
      if (params?.type) query.append('type', params.type);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const response = await this.axiosInstance.get<ApiResponse<CBTEntry[]>>(`/check-ins${suffix}`);
      return unwrapResponse(response.data) || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to load check-ins');
    }
  }

  async getCheckIn(id: string): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<CBTEntry>>(`/check-ins/${id}`);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to load check-in');
    }
  }

  async updateCheckIn(id: string, request: UpdateCBTEntryRequest): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<CBTEntry>>(`/check-ins/${id}`, request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update check-in');
    }
  }

  async deleteCheckIn(id: string): Promise<void> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<void>>(`/check-ins/${id}`);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete check-in');
    }
  }

  async assistCheckIn(id: string, request?: CheckInAssistRequest): Promise<CheckInAssistResponse> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<CheckInAssistResponse>>(
        `/check-ins/${id}/assistance`,
        request ?? {}
      );
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to load suggestions');
    }
  }

  async saveThoughtRecord(id: string, request: UpdateCBTEntryRequest): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<CBTEntry>>(`/check-ins/${id}/thought-record`, request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to save thought record');
    }
  }

  async saveProblemSolving(id: string, record: ProblemSolvingRecord): Promise<CBTEntry> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<CBTEntry>>(`/check-ins/${id}/problem-solving`, record);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to save problem-solving');
    }
  }

  async getActivityTemplates(): Promise<ActivityTemplate[]> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ActivityTemplate[]>>('/activity-templates');
      return unwrapResponse(response.data) || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to load activity options');
    }
  }

  async listActivityPlans(checkInId?: string): Promise<BehavioralActivity[]> {
    try {
      const url = checkInId ? `/activity-plans?checkInId=${encodeURIComponent(checkInId)}` : '/activity-plans';
      const response = await this.axiosInstance.get<ApiResponse<BehavioralActivity[]>>(url);
      return unwrapResponse(response.data) || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to load steps');
    }
  }

  async createActivityPlan(request: CreateBehavioralActivityRequest): Promise<BehavioralActivity> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<BehavioralActivity>>('/activity-plans', request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to save step');
    }
  }

  async updateActivityPlan(id: string, request: UpdateBehavioralActivityRequest): Promise<BehavioralActivity> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<BehavioralActivity>>(`/activity-plans/${id}`, request);
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to update step');
    }
  }

  async recordActivityAttempt(id: string, request: CreateActivityAttemptRequest): Promise<BehavioralActivity> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<BehavioralActivity>>(
        `/activity-plans/${id}/attempts`,
        request
      );
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to save what happened');
    }
  }

  async linkActivityTask(id: string): Promise<LinkActivityTaskResponse> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<LinkActivityTaskResponse>>(
        `/activity-plans/${id}/task`
      );
      return unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to add to tasks');
    }
  }

  async createPhoneUnlockEntry(request: CreatePhoneUnlockEntryRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/phone-unlock', request);
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to create phone unlock entry');
    }
  }

  async getPhoneUnlockEntries(startDate?: string, endDate?: string): Promise<PhoneUnlockEntry[]> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const url = `/phone-unlock${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.axiosInstance.get<ApiResponse<PhoneUnlockEntry[]>>(url);
      const data = unwrapResponse(response.data);
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get phone unlock entries');
    }
  }

  async getExecutionProfile(): Promise<ExecutionProfile> {
    const response = await this.axiosInstance.get<ApiResponse<ExecutionProfile>>('/execution/profile');
    return unwrapResponse(response.data);
  }

  async updateExecutionProfile(request: Partial<ExecutionProfile>): Promise<ExecutionProfile> {
    const response = await this.axiosInstance.put<ApiResponse<ExecutionProfile>>('/execution/profile', request);
    return unwrapResponse(response.data);
  }

  async getNowRecommendation(params?: { capacity?: CapacityChoice; easier?: boolean; refresh?: boolean }): Promise<NowRecommendation> {
    const query = new URLSearchParams();
    if (params?.capacity) query.set('capacity', params.capacity);
    if (params?.easier) query.set('easier', 'true');
    if (params?.refresh) query.set('refresh', 'true');
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.axiosInstance.get<ApiResponse<NowRecommendation>>(`/execution/now${suffix}`);
    return unwrapResponse(response.data);
  }

  async rejectNowSuggestion(taskId?: string | null): Promise<void> {
    await this.axiosInstance.post('/execution/now/reject', { taskId });
  }

  async getActiveSession(): Promise<WorkSession | null> {
    const response = await this.axiosInstance.get<ApiResponse<WorkSession | null>>('/execution/sessions/active');
    return unwrapResponse(response.data);
  }

  async startSession(request: { taskId?: string; blockId?: string; minutes?: number; timerEnabled?: boolean; currentAction?: string }): Promise<WorkSession> {
    const response = await this.axiosInstance.post<ApiResponse<WorkSession>>('/execution/sessions/start', request);
    return unwrapResponse(response.data);
  }

  async pauseSession(id: string): Promise<WorkSession> {
    const response = await this.axiosInstance.post<ApiResponse<WorkSession>>(`/execution/sessions/${id}/pause`);
    return unwrapResponse(response.data);
  }

  async resumeSession(id: string): Promise<WorkSession> {
    const response = await this.axiosInstance.post<ApiResponse<WorkSession>>(`/execution/sessions/${id}/resume`);
    return unwrapResponse(response.data);
  }

  async timeCheckSession(id: string): Promise<WorkSession> {
    const response = await this.axiosInstance.post<ApiResponse<WorkSession>>(`/execution/sessions/${id}/time-check`);
    return unwrapResponse(response.data);
  }

  async captureDistraction(id: string, text: string): Promise<WorkSession> {
    const response = await this.axiosInstance.post<ApiResponse<WorkSession>>(`/execution/sessions/${id}/distraction`, { text });
    return unwrapResponse(response.data);
  }

  async finishSession(id: string, request: { outcome?: string; returnPoint?: string; notes?: string }): Promise<WorkSession> {
    const response = await this.axiosInstance.post<ApiResponse<WorkSession>>(`/execution/sessions/${id}/finish`, request);
    return unwrapResponse(response.data);
  }

  async planTask(id: string): Promise<Task> {
    const response = await this.axiosInstance.post<ApiResponse<Task>>(`/execution/tasks/${id}/plan`);
    return transformTask(unwrapResponse(response.data));
  }

  async acceptTaskPlan(id: string, request: { edit?: boolean; nextActionText?: string; estimatedMinutes?: number } = {}): Promise<Task> {
    const response = await this.axiosInstance.post<ApiResponse<Task>>(`/execution/tasks/${id}/plan/accept`, request);
    return transformTask(unwrapResponse(response.data));
  }

  async helpStuck(request: { taskId?: string; sessionId?: string; explanation?: string; choice?: string; makeSmaller?: boolean }): Promise<StuckHelp> {
    const response = await this.axiosInstance.post<ApiResponse<StuckHelp>>('/execution/stuck', request);
    return unwrapResponse(response.data);
  }

  async acceptStuck(request: { sessionId?: string; taskId?: string; suggestedAction: string; suggestedMinutes?: number | null }): Promise<Task> {
    const response = await this.axiosInstance.post<ApiResponse<Task>>('/execution/stuck/accept', request);
    return transformTask(unwrapResponse(response.data));
  }

  async planDay(request: { scope?: 'today' | 'remaining'; capacity?: string } = {}): Promise<DayPlan> {
    const response = await this.axiosInstance.post<ApiResponse<DayPlan>>('/execution/day-plan', request);
    return unwrapResponse(response.data);
  }

  async applyDayPlan(draftId: string, mode: 'all' | 'first' | 'discard'): Promise<DayPlan> {
    const response = await this.axiosInstance.post<ApiResponse<DayPlan>>('/execution/day-plan/apply', { draftId, mode });
    return unwrapResponse(response.data);
  }

  async recoveryAction(request: { action: 'shorter' | 'move' | 'leave' | 'replan'; blockId?: string; taskId?: string }): Promise<NowRecommendation> {
    const response = await this.axiosInstance.post<ApiResponse<NowRecommendation>>('/execution/recovery', request);
    return unwrapResponse(response.data);
  }

  async draftReturnPoint(sessionId: string, notes?: string): Promise<ReturnPointDraft> {
    const response = await this.axiosInstance.post<ApiResponse<ReturnPointDraft>>(`/execution/sessions/${sessionId}/return-point`, { notes });
    return unwrapResponse(response.data);
  }

  async adaptRoutine(request: { definitionId?: string; blockId?: string; capacity?: string }): Promise<AdaptRoutine> {
    const response = await this.axiosInstance.post<ApiResponse<AdaptRoutine>>('/execution/routines/adapt', request);
    return unwrapResponse(response.data);
  }

  async setRoutineVersion(blockId: string, version: 'regular' | 'shorter'): Promise<void> {
    await this.axiosInstance.post(`/execution/routines/${blockId}/version`, { version });
  }

  async skipRoutine(blockId: string): Promise<void> {
    await this.axiosInstance.post(`/execution/routines/${blockId}/skip`);
  }

  async getExecutionReview(): Promise<import('../types/execution').ExecutionReview> {
    const response = await this.axiosInstance.get<ApiResponse<import('../types/execution').ExecutionReview>>('/execution/review');
    return unwrapResponse(response.data);
  }

  async syncMorningSession(session: import('../utils/morningMode').MorningSession): Promise<void> {
    await this.axiosInstance.put('/morning/session', session);
  }

  async getMorningFirstTask(): Promise<import('../utils/morningMode').MorningFirstTask> {
    const response = await this.axiosInstance.get<ApiResponse<import('../utils/morningMode').MorningFirstTask>>('/morning/first-task');
    return unwrapResponse(response.data);
  }

  async helpMorning(request: { step: string; text: string }): Promise<string | null> {
    const response = await this.axiosInstance.post<ApiResponse<{ text?: string }>>('/morning/help', request);
    return unwrapResponse(response.data)?.text ?? null;
  }

  async getLatestPipeline(): Promise<import('../types').LatestPipelineRun> {
    const response = await this.axiosInstance.get<ApiResponse<import('../types').LatestPipelineRun>>('/pipelines/latest');
    return unwrapResponse(response.data);
  }

  private handleError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(defaultMessage);
  }
}

// Export singleton instance
// HTTPAPIClient is the production implementation that connects to the backend API
export const apiClient: APIClient = new HTTPAPIClient();
