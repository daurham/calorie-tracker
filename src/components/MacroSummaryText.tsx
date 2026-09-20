import { Ingredient, Meal } from "@/types";
import { zeroTrimmer } from "@/lib/utils";

const Highlighter = ({ text }: { text: string }) => {
  return (
    <span className="text-xs text-muted-foreground text-yellow-600 dark:text-yellow-400">
      {text}
    </span>
  );
}

const formatMacroValue = (value: number | null | undefined) => {
  if (value == null) return '—';
  return `${zeroTrimmer(value)}g`;
};

const MacroSummaryText = ({ data, showCalories = false }: { data: Meal | Ingredient, showCalories?: boolean }) => {
  return (
    <p className="text-xs text-muted-foreground">
      {showCalories && <span>Calories: <Highlighter text={`${zeroTrimmer(data.calories)}`} /> </span>}
      <span>Protein: <Highlighter text={formatMacroValue(data.protein)} /> </span>
      <span>Carbs: <Highlighter text={formatMacroValue(data.carbs)} /> </span>
      <span>Fat: <Highlighter text={formatMacroValue(data.fat)} /> </span>
    </p>
  )
}

export default MacroSummaryText;