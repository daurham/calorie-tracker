import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Ingredient, MealCombo } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatMacros = (current: number | string, goal: number | string) => {
  const currentNum = typeof current === 'string' ? parseFloat(current) : current;
  const goalNum = typeof goal === 'string' ? parseFloat(goal) : goal;

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
  return comboMeals.map(combo => ({
    ...combo,
    ingredients: combo.ingredients.map(item => {
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
    })
  }));
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
