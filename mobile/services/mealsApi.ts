import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants/apiConfig';
import type {
  FoodProfile,
  UpdateFoodProfileRequest,
  InventoryList,
  InventoryBatch,
  AddInventoryBatchRequest,
  RecipeVersion,
  MealPlan,
  CreateMealPlanRequest,
  UpdateMealSlotRequest,
  TodayMealCard,
  ShoppingTrip,
  CompleteCookRequest,
} from '../types/meals';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) throw new Error(response.message || 'Request failed');
  return response.data;
}

class MealsApiClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: `${API_CONFIG.baseURL}/meals`,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    this.http.interceptors.response.use(
      (r) => r,
      (err) => {
        const msg = (err.response?.data as ApiResponse<unknown>)?.message
          ?? err.message
          ?? 'Unknown error';
        throw new Error(msg);
      }
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async getProfile(): Promise<FoodProfile> {
    const r = await this.http.get<ApiResponse<FoodProfile>>('/profile');
    return unwrap(r.data);
  }

  async updateProfile(request: UpdateFoodProfileRequest): Promise<FoodProfile> {
    const r = await this.http.patch<ApiResponse<FoodProfile>>('/profile', request);
    return unwrap(r.data);
  }

  // ── Inventory ─────────────────────────────────────────────────────────────

  async getInventory(): Promise<InventoryList> {
    const r = await this.http.get<ApiResponse<InventoryList>>('/inventory');
    return unwrap(r.data);
  }

  async addInventoryBatch(request: AddInventoryBatchRequest): Promise<InventoryBatch> {
    const r = await this.http.post<ApiResponse<InventoryBatch>>('/inventory', request);
    return unwrap(r.data);
  }

  async discardBatch(id: string, reason?: string): Promise<void> {
    await this.http.post(`/inventory/${id}/discard`, { id, reason });
  }

  // ── Recipes ───────────────────────────────────────────────────────────────

  async getRecipes(): Promise<RecipeVersion[]> {
    const r = await this.http.get<ApiResponse<RecipeVersion[]>>('/recipes');
    return unwrap(r.data);
  }

  async getRecipe(id: string): Promise<RecipeVersion> {
    const r = await this.http.get<ApiResponse<RecipeVersion>>(`/recipes/${id}`);
    return unwrap(r.data);
  }

  // ── Plans ─────────────────────────────────────────────────────────────────

  async getActivePlan(): Promise<MealPlan | null> {
    const r = await this.http.get<ApiResponse<MealPlan | null>>('/plans/active');
    return unwrap(r.data);
  }

  async createPlan(request: CreateMealPlanRequest): Promise<MealPlan> {
    const r = await this.http.post<ApiResponse<MealPlan>>('/plans', request);
    return unwrap(r.data);
  }

  async activatePlan(id: string): Promise<MealPlan> {
    const r = await this.http.post<ApiResponse<MealPlan>>(`/plans/${id}/activate`);
    return unwrap(r.data);
  }

  async updateSlot(planId: string, slotId: string, request: UpdateMealSlotRequest): Promise<MealPlan> {
    const r = await this.http.patch<ApiResponse<MealPlan>>(`/plans/${planId}/slots/${slotId}`, request);
    return unwrap(r.data);
  }

  async getTodayCard(): Promise<TodayMealCard> {
    const r = await this.http.get<ApiResponse<TodayMealCard>>('/today-card');
    return unwrap(r.data);
  }

  // ── Shopping ─────────────────────────────────────────────────────────────

  async getShoppingTrip(planId: string): Promise<ShoppingTrip | null> {
    const r = await this.http.get<ApiResponse<ShoppingTrip | null>>(`/plans/${planId}/shopping`);
    return unwrap(r.data);
  }

  async generateShoppingTrip(planId: string): Promise<ShoppingTrip> {
    const r = await this.http.post<ApiResponse<ShoppingTrip>>(`/plans/${planId}/shopping/generate`);
    return unwrap(r.data);
  }

  async updateShoppingLine(tripId: string, lineId: string, updates: {
    isChecked?: boolean;
    isUnavailable?: boolean;
    boughtAmount?: number;
  }): Promise<void> {
    await this.http.patch(`/shopping/${tripId}/lines/${lineId}`, { lineId, ...updates });
  }

  async finishShopping(tripId: string, lines: Array<{
    lineId: string;
    isChecked: boolean;
    isUnavailable: boolean;
    boughtAmount?: number;
  }>, receiptTotalEur?: number): Promise<void> {
    await this.http.post('/shopping/finish', { tripId, lines, receiptTotalEur });
  }

  // ── Cooking ───────────────────────────────────────────────────────────────

  async completeCook(request: CompleteCookRequest): Promise<void> {
    await this.http.post('/cooking/complete', request);
  }
}

export const mealsApi = new MealsApiClient();
