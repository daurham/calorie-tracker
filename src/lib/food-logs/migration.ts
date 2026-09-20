import type { LoggedMeal } from '../utils';
import type { FoodLog } from '../../types/food-log';
import { FOOD_LOGS_MIGRATION_MARKER, TODAYS_MEALS_STORAGE_KEY } from './constants';
import { loggedMealToFoodLogInput } from './map';
import { createFoodLogs, getFoodLogs } from './api-client';
import { getLocalDayRange } from './day-range';

export const readLegacyTodaysMeals = (): LoggedMeal[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(TODAYS_MEALS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const isFoodLogsMigrationComplete = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(FOOD_LOGS_MIGRATION_MARKER) === 'true';
};

export const markFoodLogsMigrationComplete = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(FOOD_LOGS_MIGRATION_MARKER, 'true');
};

export const buildMigratedFoodLogInputs = (meals: LoggedMeal[]) =>
  meals.map(meal => loggedMealToFoodLogInput(meal, { migrated: true }));

export const migrateLegacyTodaysMealsIfNeeded = async (): Promise<{
  migrated: boolean;
  skippedReason?: string;
  logs: FoodLog[];
}> => {
  if (isFoodLogsMigrationComplete()) {
    return { migrated: false, skippedReason: 'already_migrated', logs: [] };
  }

  const legacyMeals = readLegacyTodaysMeals();
  if (legacyMeals.length === 0) {
    markFoodLogsMigrationComplete();
    return { migrated: false, skippedReason: 'nothing_to_migrate', logs: [] };
  }

  const existing = await getFoodLogs(getLocalDayRange());
  if (existing.logs.length > 0) {
    markFoodLogsMigrationComplete();
    return { migrated: false, skippedReason: 'server_already_has_logs', logs: existing.logs };
  }

  const created = await createFoodLogs({
    logs: buildMigratedFoodLogInputs(legacyMeals),
  });

  markFoodLogsMigrationComplete();
  return { migrated: true, logs: created.logs };
};
