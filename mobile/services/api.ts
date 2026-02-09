// API client with HTTP implementation
// Connects to backend API
import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  TodayResponse,
  ScheduleBlock,
  Deadline,
  MoneySummary,
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
} from '../types';
import { API_CONFIG, getApiUrl } from '../constants/apiConfig';
import {
  unwrapResponse,
  transformScheduleBlock,
  transformTask,
  transformDisciplineEntry,
  transformDietEntry,
  transformWeeklyReview,
  type ApiResponse,
} from '../utils/apiResponseTransformer';

// API Client Interface
export interface APIClient {
  // GET endpoints
  getToday(): Promise<TodayResponse>;
  getSchedule(): Promise<ScheduleBlock[]>;
  getDeadlines(): Promise<Deadline[]>;
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
  
  // POST endpoints
  completeBetterItem(request: CompleteBetterItemRequest): Promise<void>;
  acceptBetterItem(request: AcceptBetterItemRequest): Promise<void>;
  editBetterItem(request: EditBetterItemRequest): Promise<void>;
  rejectBetterItem(request: RejectBetterItemRequest): Promise<void>;
  updateScheduleBlock(request: UpdateScheduleBlockRequest): Promise<void>;
  createTask(request: CreateTaskRequest): Promise<void>;
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
  submitWeeklyReview(request: SubmitWeeklyReviewRequest): Promise<void>;
  submitAIInput(text: string): Promise<void>;
  
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
        betterItems: data.betterItems || [],
        tasks: (data.tasks || []).map(transformTask),
        discipline: transformDisciplineEntry(data.discipline || {}),
        diet: transformDietEntry(data.diet || {}),
        currentBlock: data.currentBlock ? {
          id: data.currentBlock.id,
          title: data.currentBlock.title,
          startTime: data.currentBlock.startTime,
          endTime: data.currentBlock.endTime,
        } : {
          id: '',
          title: '',
          startTime: '',
          endTime: '',
        },
        deadlineWarning: data.deadlineWarning,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch today\'s data');
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

  async createTask(request: CreateTaskRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<any>>('/tasks', request);
      unwrapResponse(response.data);
      // Ignore returned TaskDto, frontend expects void
    } catch (error) {
      throw this.handleError(error, 'Failed to create task');
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

  async submitWeeklyReview(request: SubmitWeeklyReviewRequest): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<any>>('/weekly-review/submit', request);
      unwrapResponse(response.data);
      // Ignore returned WeeklyReviewDto, frontend expects void
    } catch (error) {
      throw this.handleError(error, 'Failed to submit weekly review');
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

  async submitAIInput(text: string): Promise<void> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/ai-input', { text });
      unwrapResponse(response.data);
    } catch (error) {
      throw this.handleError(error, 'Failed to submit input for AI processing');
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
