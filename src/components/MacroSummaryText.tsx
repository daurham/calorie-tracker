import { Ingredient, Meal } from "@/types";
import { zeroTrimmer } from "@/lib/utils";

const Highlighter = ({ text }: { text: string }) => {
  return (
    <span className="text-xs text-muted-foreground text-yellow-600 dark:text-yellow-400">
      {text}
    </span>
  );
}

const MacroSummaryText = ({ data, showCalories = false }: { data: Meal | Ingredient, showCalories?: boolean }) => {
  return (
    <p className="text-xs text-muted-foreground">
      {showCalories && <span>Calories: <Highlighter text={`${zeroTrimmer(data.calories)}`} /> </span>}
      <span>Protein: <Highlighter text={`${zeroTrimmer(data.protein)}g`} /> </span>
      <span>Carbs: <Highlighter text={`${zeroTrimmer(data.carbs)}g`} /> </span>
      <span>Fat: <Highlighter text={`${zeroTrimmer(data.fat)}g`} /> </span>
    </p>
  )
}

export default MacroSummaryText;