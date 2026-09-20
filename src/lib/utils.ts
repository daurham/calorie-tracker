import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Ingredient, Meal, MealCombo } from "@/types";

export type MealTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type LoggedMeal = Omit<Meal, 'ingredients' | 'protein' | 'carbs' | 'fat'> & {
  uniqueMealId?: number;
  foodLogId?: number;
  foodLogGroupId?: string | null;
  timestamp?: string;
  isEdited?: boolean;
  portion?: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  ingredients?: Array<Partial<Ingredient> & { id?: number; name?: string; quantity?: number }>;
  modData?: unknown;
  modId?: string;
  weight?: number;
  servingDescription?: string | null;
  sourceType?: string;
  nutritionSource?: string;
  originalInput?: string | null;
};

export const calculateComposedMealTotals = (
  ingredients: Array<Partial<Ingredient> & { quantity?: number }>
): MealTotals => {
  const totals = ingredients.reduce(
    (acc, ingredient) => {
      const quantity = Number(ingredient.quantity) || 0;
      return {
        calories: acc.calories + (Number(ingredient.calories) || 0) * quantity,
        protein: acc.protein + (Number(ingredient.protein) || 0) * quantity,
        carbs: acc.carbs + (Number(ingredient.carbs) || 0) * quantity,
        fat: acc.fat + (Number(ingredient.fat) || 0) * quantity,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    calories: Math.round(totals.calories),
    protein: Number(totals.protein.toFixed(1)),
    carbs: Number(totals.carbs.toFixed(1)),
    fat: Number(totals.fat.toFixed(1)),
  };
};

export const applyPortionToTotals = (totals: MealTotals, portion = 1): MealTotals => ({
  calories: Math.round(Number(totals.calories) * portion),
  protein: Number((Number(totals.protein) * portion).toFixed(1)),
  carbs: Number((Number(totals.carbs) * portion).toFixed(1)),
  fat: Number((Number(totals.fat) * portion).toFixed(1)),
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatMacros = (current: number | string | null | undefined, goal: number | string) => {
  const goalNum = typeof goal === 'string' ? parseFloat(goal) : goal;
  if (current == null || current === '') {
    return {
      protein: `— / ${Math.round(goalNum)}g`,
      carbs: `— / ${Math.round(goalNum)}g`,
      fat: `— / ${Math.round(goalNum)}g`
    };
  }

  const currentNum = typeof current === 'string' ? parseFloat(current) : current;

  if (currentNum == 0 && goalNum == 0) {
    return {
      protein: "0g / 0g",
      carbs: "0g / 0g",
      fat: "0g / 0g"
    };
  }
  
  return {
    protein: `${Math.round(currentNum)}g / ${Math.round(goalNum)}g`,
    carbs: `${Math.round(currentNum)}g / ${Math.round(goalNum)}g`,
    fat: `${Math.round(currentNum)}g / ${Math.round(goalNum)}g`
  };
};

export const formatMacroProgress = (progress: number | string) => {
  // console.log("progress", progress);
  const progressNum = typeof progress === 'string' ? parseFloat(progress) : progress;
  return `${Math.round(progressNum)}%`;
};

export const mapComboMealsWithIngredients = (
  comboMeals: MealCombo[],
  allIngredients: Ingredient[]
) => {
  return comboMeals.map(combo => {
    const ingredients = (combo.ingredients || []).map(item => {
      const ingredient = allIngredients.find(ing => ing?.id === item?.id);
      if (!ingredient) {
        console.warn(`Ingredient with id ${item?.id} not found`);
        return item;
      }
      return {
        ...item,
        ...ingredient,
        quantity: item?.quantity
      };
    });

    const shouldRecalculate = combo.meal_type !== 'standalone';
    const totals = shouldRecalculate
      ? calculateComposedMealTotals(ingredients)
      : {
          calories: Math.round(Number(combo.calories) || 0),
          protein: Number(combo.protein) || 0,
          carbs: Number(combo.carbs) || 0,
          fat: Number(combo.fat) || 0,
        };

    return {
      ...combo,
      ...totals,
      ingredients,
    };
  });
};

export const reconcileLoggedMeals = (
  loggedMeals: LoggedMeal[],
  mealsData: Meal[]
): LoggedMeal[] => {
  return loggedMeals.map(oldMeal => {
    const updatedMeal = mealsData.find(meal => meal.id === oldMeal.id);
    if (!updatedMeal) {
      return {
        ...oldMeal,
        uniqueMealId: oldMeal?.uniqueMealId || generateUniqueId()
      };
    }

    if (oldMeal.isEdited) {
      return {
        ...updatedMeal,
        ...oldMeal,
        uniqueMealId: oldMeal?.uniqueMealId || generateUniqueId(),
      };
    }

    const portion = oldMeal?.portion || 1;
    return {
      ...updatedMeal,
      uniqueMealId: oldMeal?.uniqueMealId || generateUniqueId(),
      timestamp: oldMeal?.timestamp || "",
      isEdited: false,
      portion,
      ...applyPortionToTotals(updatedMeal, portion),
      ingredients: updatedMeal.ingredients,
      modData: oldMeal?.modData || (updatedMeal as LoggedMeal).modData,
    };
  });
};

export const sumLoggedMealTotals = (meals: Array<Partial<MealTotals>>) => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      carbs: acc.carbs + (Number(meal.carbs) || 0),
      fat: acc.fat + (Number(meal.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

const uniqueIdCache = new Map<number, number>();
export const generateUniqueId = () => {
  const randomId = Math.floor(Math.random() * 1000000);
  if (uniqueIdCache.has(randomId)) {
    return generateUniqueId(); // Recursively try again if ID exists
  }
  uniqueIdCache.set(randomId, randomId);
  return randomId;
};

/**
 * Remove trailing zeros from numbers
 * @param value - The number to trim
 * @returns The trimmed number as a string
 * @example 5.20 -> 5.2
 * @example 58.80 -> 58.8
 * @example 9.0 -> 9
 * @example 1000.00 -> 1000
 * @example 1000 -> 1000 (unchanged)
 */
export const zeroTrimmer = (value: number) => {
  if (!value) return "0";
  return value.toString().replace(/\.(\d*?)0+$/, (match, digits) => {
    return digits ? `.${digits}` : '';
  });
}

/**
 * Delay execution of a callback function
 * @param callback - The function to execute
 * @param ms - The delay in milliseconds (default: 500)
 */
export const delay = (callback: () => void, ms = 500) => {
  setTimeout(() => {
    callback()
  }, ms)
}

export const capitalizeMealName = (name: string): string => {
  const lowercaseWords = ['and', 'to', 'of', 'in', 'with', 'for', 'the', 'a', 'an', 'or', 'but', 'at', 'by', 'from', 'up', 'on', 'off', 'out', 'over', 'under', 'into', 'onto', 'upon', 'within', 'without', 'through', 'throughout', 'during', 'before', 'after', 'since', 'until', 'while', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'that', 'this', 'these', 'those'];
  
  // Split by spaces and preserve punctuation
  const parts = name.toLowerCase().split(/(\s+|[()\[\]{}])/);
  
  return parts.map((part, index) => {
    // Skip if it's just whitespace or punctuation
    if (/^\s*$/.test(part) || /^[()\[\]{}]$/.test(part)) {
      return part;
    }
    
    // Split the part into words and punctuation
    const words = part.split(/(\s+)/);
    
    return words.map((word, wordIndex) => {
      // Skip if it's just whitespace
      if (/^\s*$/.test(word)) {
        return word;
      }
      
      // Check if this is the first word of the entire name
      const isFirstWord = index === 0 && wordIndex === 0;
      
      // Don't capitalize common words unless they're the first word
      if (!isFirstWord && lowercaseWords.includes(word.toLowerCase())) {
        return word;
      }
      
      // Capitalize the word
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('');
  }).join('');
};
