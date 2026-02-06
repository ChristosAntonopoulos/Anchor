// API client with HTTP implementation
// Connects to backend API
import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  TodayResponse,
  ScheduleBlock,
  Deadline,
  MoneySummary,
  WeeklyReview,
  CompleteBetterItemRequest,
  AcceptBetterItemRequest,
  EditBetterItemRequest,
  RejectBetterItemRequest,
  UpdateScheduleBlockRequest,
  CreateTaskRequest,
  CompleteTaskRequest,
  UpdateDisciplineRequest,
  UpdateDietRequest,
  CreateIncomeRequest,
  SubmitWeeklyReviewRequest,
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
  
  // POST endpoints
  completeBetterItem(request: CompleteBetterItemRequest): Promise<void>;
  acceptBetterItem(request: AcceptBetterItemRequest): Promise<void>;
  editBetterItem(request: EditBetterItemRequest): Promise<void>;
  rejectBetterItem(request: RejectBetterItemRequest): Promise<void>;
  updateScheduleBlock(request: UpdateScheduleBlockRequest): Promise<void>;
  createTask(request: CreateTaskRequest): Promise<void>;
  completeTask(request: CompleteTaskRequest): Promise<void>;
  updateDiscipline(request: UpdateDisciplineRequest): Promise<void>;
  updateDiet(request: UpdateDietRequest): Promise<void>;
  createIncome(request: CreateIncomeRequest): Promise<void>;
  submitWeeklyReview(request: SubmitWeeklyReviewRequest): Promise<void>;
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

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
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
          throw new Error('Network error. Please check your connection and ensure the backend is running.');
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
      // Transform: { discipline: {...} } → { gym?, walk?, ... }
      const backendRequest = request.discipline;
      const response = await this.axiosInstance.put<ApiResponse<void>>('/discipline', backendRequest);
      unwrapResponse(response.data);
      // Ignore returned DisciplineEntryDto, frontend expects void
    } catch (error) {
      throw this.handleError(error, 'Failed to update discipline');
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
