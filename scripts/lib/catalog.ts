import fs from 'fs';
import path from 'path';

export const CATALOG_VERSION = 1;
export const CATALOG_DIR = path.join(process.cwd(), 'data-catalog');
export const INGREDIENTS_PATH = path.join(CATALOG_DIR, 'ingredients.json');
export const MEALS_PATH = path.join(CATALOG_DIR, 'meals.json');

export interface CatalogIngredient {
  /** Present on export; keep when editing so renames update the same row. Omit for new rows. */
  id?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  is_staple?: boolean;
}

export interface CatalogMealIngredient {
  name: string;
  quantity: number;
}

export interface CatalogMeal {
  /** Present on export; keep when editing so renames update the same row. Omit for new rows. */
  id?: number;
  name: string;
  meal_type: 'composed' | 'standalone';
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string | null;
  instructions?: string | null;
  /** Required for composed meals; ignored for standalone. Match ingredients by name. */
  ingredients?: CatalogMealIngredient[];
}

export interface IngredientsFile {
  version: number;
  exportedAt: string;
  ingredients: CatalogIngredient[];
}

export interface MealsFile {
  version: number;
  exportedAt: string;
  meals: CatalogMeal[];
}

export function ensureCatalogDir(): void {
  if (!fs.existsSync(CATALOG_DIR)) {
    fs.mkdirSync(CATALOG_DIR, { recursive: true });
  }
}

export function writeJson(filePath: string, data: unknown): void {
  ensureCatalogDir();
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing catalog file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function toNumber(value: unknown, field: string): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${field}: ${String(value)}`);
  }
  return n;
}
