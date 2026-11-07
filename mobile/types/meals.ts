// Meals module type definitions

export type StorageLocation = 'Fridge' | 'Freezer' | 'Cupboard';
export type DateType = 'UseBy' | 'BestBefore' | 'NoPrintedDate' | 'Unknown';
export type MealSlotKind = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type MealKind = 'FreshCook' | 'Leftovers' | 'FrozenPortion' | 'NoCook' | 'EatingOut';
export type MealSlotState = 'Planned' | 'Cooked' | 'PartlyCooked' | 'Skipped' | 'EatingOut';
export type MealPlanStatus = 'Draft' | 'Active' | 'Archived';

export interface FoodProfile {
  id: string;
  defaultServings: number;
  allergies: string[] | null;
  allergyStatus: 'Unknown' | 'NoneKnown' | 'HasRestrictions';
  dislikedFoods: string[];
  likedFoods: string[];
  typicalWeekdayHandsOnMinutes: number | null;
  availableEquipment: string[];
  leftoverPreference: 'Unknown' | 'HappyToRepeat' | 'OneRepeat' | 'PreferFresh';
  freezerUseWelcome: boolean | null;
  explorationLevel: 'MostlyFamiliar' | 'Mixed' | 'Explore';
  preferredShoppingDays: string[];
  shoppingTripsPerWeek: number | null;
  weeklyBudgetEur: number | null;
  budgetFirm: boolean | null;
  timezone: string;
  locale: string;
  version: number;
  setupComplete: boolean;
}

export interface UpdateFoodProfileRequest {
  defaultServings?: number;
  allergies?: string[];
  allergyStatus?: string;
  dislikedFoods?: string[];
  likedFoods?: string[];
  typicalWeekdayHandsOnMinutes?: number;
  availableEquipment?: string[];
  leftoverPreference?: string;
  freezerUseWelcome?: boolean;
  explorationLevel?: string;
  preferredShoppingDays?: string[];
  shoppingTripsPerWeek?: number;
  weeklyBudgetEur?: number;
  budgetFirm?: boolean;
  setupComplete?: boolean;
  expectedVersion?: number;
}

export interface InventoryBatch {
  id: string;
  ingredientId: string | null;
  rawName: string;
  form: string;
  currentAmount: number;
  unit: string;
  amountIsApproximate: boolean;
  location: StorageLocation;
  printedDateText: string | null;
  printedDate: string | null;
  dateType: DateType;
  openedAt: string | null;
  frozenAt: string | null;
  thawedAt: string | null;
  purchasedAt: string | null;
  labelStorageInstructions: string | null;
  isDiscarded: boolean;
  isConsumed: boolean;
  confidence: 'UserConfirmed' | 'ExtractedReviewPending' | 'Approximate';
  notes: string | null;
  createdAt: string;
  version: number;
}

export interface InventoryList {
  useSoon: InventoryBatch[];
  fridge: InventoryBatch[];
  freezer: InventoryBatch[];
  cupboard: InventoryBatch[];
}

export interface AddInventoryBatchRequest {
  ingredientId?: string;
  rawName: string;
  form?: string;
  amount: number;
  unit: string;
  amountIsApproximate?: boolean;
  location?: string;
  printedDateText?: string;
  printedDate?: string;
  dateType?: string;
  isOpened?: boolean;
  openedAt?: string;
  purchasedAt?: string;
  labelStorageInstructions?: string;
  notes?: string;
}

export interface RecipeVersion {
  id: string;
  recipeId: string;
  versionNumber: number;
  nameEl: string;
  nameEn: string;
  sourceKind: 'AiGenerated' | 'UserImported' | 'Curated';
  sourceUrl?: string;
  sourceAttribution?: string;
  yieldServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  handsonMinutes: number;
  totalMinutes: number;
  equipment: string[];
  tags: string[];
  validationStatus: string;
}

export interface RecipeIngredient {
  ingredientId?: string;
  rawName: string;
  form?: string;
  amount?: number;
  unit?: string;
  qualitativeAmount?: string;
  isOptional: boolean;
  allergenFlags: string[];
}

export interface RecipeStep {
  stepNumber: number;
  action: string;
  durationMinutes?: number;
  isActive: boolean;
  dependsOnSteps: number[];
  equipment: string[];
}

export interface MealSlot {
  id: string;
  localDate: string;
  slot: MealSlotKind;
  kind: MealKind;
  recipeVersionId?: string;
  recipeName?: string;
  servings: number;
  locked: boolean;
  sourceMealSlotId?: string;
  reasonSummary?: string;
  handsonMinutes?: number;
  totalMinutes?: number;
  state: MealSlotState;
  cookEventId?: string;
  missingIngredients: string[];
  uncertainIngredients: string[];
}

export interface MealPlan {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  slots: MealSlot[];
  status: MealPlanStatus;
  version: number;
}

export interface CreateMealPlanRequest {
  weekStartDate: string;
  weekEndDate: string;
  slots: CreateMealSlotRequest[];
}

export interface CreateMealSlotRequest {
  localDate: string;
  slot: string;
  kind: string;
  recipeVersionId?: string;
  recipeName?: string;
  servings: number;
  locked?: boolean;
  reasonSummary?: string;
  handsonMinutes?: number;
  totalMinutes?: number;
}

export interface UpdateMealSlotRequest {
  kind?: string;
  recipeVersionId?: string;
  recipeName?: string;
  servings?: number;
  locked?: boolean;
  state?: string;
  handsonMinutes?: number;
  totalMinutes?: number;
}

export interface TodayMealCard {
  planId?: string | null;
  nextMeal: MealSlot | null;
  actionableReminder: string | null;
  hasUnconfirmedIngredients: boolean;
}

export interface CookReady {
  planId: string;
  slot: MealSlot;
  recipe: RecipeVersion;
}

export interface GenerateRecipeRequest {
  name: string;
  servings?: number;
}

export interface ShoppingLine {
  id: string;
  ingredientId?: string;
  rawName: string;
  requiredAmount: number;
  unit: string;
  suggestedPackSize?: string;
  whyNeeded?: string;
  firstRequiredDate?: string;
  estimatedPriceEur?: number;
  priceSource?: string;
  isChecked: boolean;
  isUnavailable: boolean;
  boughtAmount?: number;
  category?: string;
  isCheckAtHome: boolean;
}

export interface ShoppingTrip {
  id: string;
  mealPlanId: string;
  plannedDate?: string;
  plannedWindow?: string;
  lines: ShoppingLine[];
  status: 'Planned' | 'InProgress' | 'Completed';
  completedAt?: string;
  receiptTotalEur?: number;
  confirmedPriceTotal?: number;
  unpricedItems: number;
}

export interface CompleteCookRequest {
  mealSlotId: string;
  recipeVersionId?: string;
  outcome: 'Cooked' | 'PartlyCooked' | 'DidNotCook';
  actualServings?: number;
  actualHandsonMinutes?: number;
  ingredientAdjustments?: Array<{
    rawName: string;
    amountUsed?: number;
    unit?: string;
    batchId?: string;
  }>;
  storedPortions?: Array<{
    description: string;
    portions: number;
    location: string;
    storedAt?: string;
  }>;
  feedbackMakeAgain?: 'Yes' | 'WithChanges' | 'NotForMe';
  feedbackReason?: string;
  idempotencyKey?: string;
}
