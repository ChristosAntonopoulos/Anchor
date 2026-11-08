export const MEAL_SLOT_LABELS: Record<string, string> = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Dinner: 'Dinner',
  Snack: 'Snack',
};

export const MEAL_KIND_LABELS: Record<string, string> = {
  FreshCook: 'Cook',
  Leftovers: 'Leftovers',
  FrozenPortion: 'Frozen',
  NoCook: 'No cook',
  EatingOut: 'Eating out',
};

export const DAY_SHORT_LABELS: Record<string, string> = {
  Mon: 'Mon',
  Tue: 'Tue',
  Wed: 'Wed',
  Thu: 'Thu',
  Fri: 'Fri',
  Sat: 'Sat',
  Sun: 'Sun',
};

export const STORAGE_LABELS: Record<string, string> = {
  Fridge: 'Fridge',
  Freezer: 'Freezer',
  Cupboard: 'Cupboard',
};

export const DATE_TYPE_LABELS: Record<string, string> = {
  UseBy: 'Use by',
  BestBefore: 'Best before',
  NoPrintedDate: 'No printed date',
  Unknown: 'Date unknown',
};

export function recipeDisplayName(recipe?: { nameEn?: string; nameEl?: string } | null): string {
  return recipe?.nameEn?.trim() || recipe?.nameEl?.trim() || 'Recipe';
}
