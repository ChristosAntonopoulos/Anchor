import { create } from 'zustand';
import { mealsApi } from '../services/mealsApi';
import type {
  FoodProfile,
  UpdateFoodProfileRequest,
  InventoryList,
  InventoryBatch,
  AddInventoryBatchRequest,
  RecipeVersion,
  MealPlan,
  CreateMealPlanRequest,
  TodayMealCard,
  ShoppingTrip,
  CookReady,
  UpdateMealSlotRequest,
} from '../types/meals';

interface MealsStore {
  // Profile
  profile: FoodProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (request: UpdateFoodProfileRequest) => Promise<void>;

  // Inventory
  inventory: InventoryList | null;
  inventoryLoading: boolean;
  inventoryError: string | null;
  fetchInventory: () => Promise<void>;
  addBatch: (request: AddInventoryBatchRequest) => Promise<InventoryBatch>;
  discardBatch: (id: string, reason?: string) => Promise<void>;

  // Recipes
  recipes: RecipeVersion[];
  recipesLoading: boolean;
  fetchRecipes: () => Promise<void>;

  // Plan
  activePlan: MealPlan | null;
  planLoading: boolean;
  planError: string | null;
  fetchActivePlan: () => Promise<void>;
  createPlan: (request: CreateMealPlanRequest) => Promise<MealPlan>;
  activatePlan: (id: string) => Promise<void>;
  updateSlot: (planId: string, slotId: string, request: UpdateMealSlotRequest) => Promise<void>;
  cookReady: (planId: string, slotId: string) => Promise<CookReady>;
  generateRecipe: (name: string, servings?: number) => Promise<RecipeVersion>;
  getAlternatives: (excludeId?: string) => Promise<RecipeVersion[]>;
  completeCook: (slotId: string, recipeVersionId?: string) => Promise<void>;

  // Today card
  todayCard: TodayMealCard | null;
  todayCardLoading: boolean;
  fetchTodayCard: () => Promise<void>;

  // Shopping
  shoppingTrip: ShoppingTrip | null;
  shoppingLoading: boolean;
  fetchShoppingTrip: (planId: string) => Promise<void>;
  generateShoppingTrip: (planId: string) => Promise<void>;
  checkShoppingLine: (tripId: string, lineId: string, checked: boolean) => Promise<void>;
  finishShopping: (tripId: string, receiptTotal?: number) => Promise<void>;
}

export const useMealsStore = create<MealsStore>((set, get) => ({
  // Profile
  profile: null,
  profileLoading: false,
  profileError: null,

  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    try {
      const profile = await mealsApi.getProfile();
      set({ profile, profileLoading: false });
    } catch (e) {
      set({ profileError: e instanceof Error ? e.message : 'Error', profileLoading: false });
    }
  },

  updateProfile: async (request) => {
    try {
      const profile = await mealsApi.updateProfile(request);
      set({ profile });
    } catch (e) {
      set({ profileError: e instanceof Error ? e.message : 'Error' });
      throw e;
    }
  },

  // Inventory
  inventory: null,
  inventoryLoading: false,
  inventoryError: null,

  fetchInventory: async () => {
    set({ inventoryLoading: true, inventoryError: null });
    try {
      const inventory = await mealsApi.getInventory();
      set({ inventory, inventoryLoading: false });
    } catch (e) {
      set({ inventoryError: e instanceof Error ? e.message : 'Error', inventoryLoading: false });
    }
  },

  addBatch: async (request) => {
    const batch = await mealsApi.addInventoryBatch(request);
    await get().fetchInventory();
    return batch;
  },

  discardBatch: async (id, reason) => {
    await mealsApi.discardBatch(id, reason);
    await get().fetchInventory();
  },

  // Recipes
  recipes: [],
  recipesLoading: false,

  fetchRecipes: async () => {
    set({ recipesLoading: true });
    try {
      const recipes = await mealsApi.getRecipes();
      set({ recipes, recipesLoading: false });
    } catch {
      set({ recipesLoading: false });
    }
  },

  // Plan
  activePlan: null,
  planLoading: false,
  planError: null,

  fetchActivePlan: async () => {
    set({ planLoading: true, planError: null });
    try {
      const plan = (await mealsApi.getActivePlan()) ?? (await mealsApi.ensureWeek());
      set({ activePlan: plan, planLoading: false });
    } catch (e) {
      set({ planError: e instanceof Error ? e.message : 'Error', planLoading: false });
    }
  },

  createPlan: async (request) => {
    const plan = await mealsApi.createPlan(request);
    set({ activePlan: plan });
    return plan;
  },

  activatePlan: async (id) => {
    const plan = await mealsApi.activatePlan(id);
    set({ activePlan: plan });
  },

  updateSlot: async (planId, slotId, request) => {
    const plan = await mealsApi.updateSlot(planId, slotId, request);
    set({ activePlan: plan });
    await get().fetchTodayCard();
  },

  cookReady: (planId, slotId) => mealsApi.cookReady(planId, slotId),

  generateRecipe: async (name, servings = 2) => {
    const recipe = await mealsApi.generateRecipe({ name, servings });
    await get().fetchRecipes();
    return recipe;
  },

  getAlternatives: (excludeId) => mealsApi.getAlternatives(excludeId),

  completeCook: async (slotId, recipeVersionId) => {
    await mealsApi.completeCook({
      mealSlotId: slotId,
      recipeVersionId,
      outcome: 'Cooked',
    });
    await Promise.all([get().fetchActivePlan(), get().fetchTodayCard()]);
  },

  // Today card
  todayCard: null,
  todayCardLoading: false,

  fetchTodayCard: async () => {
    set({ todayCardLoading: true });
    try {
      const card = await mealsApi.getTodayCard();
      set({ todayCard: card, todayCardLoading: false });
    } catch {
      set({ todayCardLoading: false });
    }
  },

  // Shopping
  shoppingTrip: null,
  shoppingLoading: false,

  fetchShoppingTrip: async (planId) => {
    set({ shoppingLoading: true });
    try {
      const trip = await mealsApi.getShoppingTrip(planId);
      set({ shoppingTrip: trip, shoppingLoading: false });
    } catch {
      set({ shoppingLoading: false });
    }
  },

  generateShoppingTrip: async (planId) => {
    set({ shoppingLoading: true });
    try {
      const trip = await mealsApi.generateShoppingTrip(planId);
      set({ shoppingTrip: trip, shoppingLoading: false });
    } catch {
      set({ shoppingLoading: false });
    }
  },

  checkShoppingLine: async (tripId, lineId, checked) => {
    await mealsApi.updateShoppingLine(tripId, lineId, { isChecked: checked });
    const trip = get().shoppingTrip;
    if (trip) {
      const updatedLines = trip.lines.map(l =>
        l.id === lineId ? { ...l, isChecked: checked } : l
      );
      set({ shoppingTrip: { ...trip, lines: updatedLines } });
    }
  },

  finishShopping: async (tripId, receiptTotal) => {
    const trip = get().shoppingTrip;
    if (!trip) return;
    const lines = trip.lines.map(l => ({
      lineId: l.id,
      isChecked: l.isChecked,
      isUnavailable: l.isUnavailable,
      boughtAmount: l.boughtAmount,
    }));
    await mealsApi.finishShopping(tripId, lines, receiptTotal);
    await get().fetchInventory();
  },
}));
