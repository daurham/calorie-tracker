export const TODAYS_MEALS_STORAGE_KEY = 'nutritrack_todays_meals';
export const FOOD_LOGS_MIGRATION_MARKER = 'nutritrack_food_logs_migrated_v1';

export const FOOD_LOG_SOURCE_TYPES = [
  'ingredient',
  'meal_combo',
  'food',
  'historical_log',
  'quick_calories',
  'usda',
  'open_food_facts',
  'nutrition_label',
  'ai_estimate',
  'mod',
  'legacy',
] as const;

export const FOOD_LOG_NUTRITION_SOURCES = [
  'user_entered',
  'legacy',
  'usda',
  'open_food_facts',
  'nutrition_label',
  'ai_reference',
  'ai_estimate',
  'catalog',
] as const;
