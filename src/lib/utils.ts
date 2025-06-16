import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatMacros = (current: number | string, goal: number | string) => {
  const currentNum = typeof current === 'string' ? parseFloat(current) : current;
  const goalNum = typeof goal === 'string' ? parseFloat(goal) : goal;

  if (currentNum == 0 || goalNum == 0) {
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
  console.log("progress", progress);
  const progressNum = typeof progress === 'string' ? parseFloat(progress) : progress;
  return `${Math.round(progressNum)}%`;
};
