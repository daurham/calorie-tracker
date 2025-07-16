import { Meal } from "@/types";

const UnitText = ({ unit }: { unit: string }) => {
  return (
    <span className="text-xs text-muted-foreground text-yellow-600 dark:text-yellow-400">
      {unit}
    </span>
  );
}

const MacroSummaryText = ({ meal }: { meal: Meal }) => {
  return (
    <p className="text-sm text-muted-foreground">
      {meal.calories} <UnitText unit="cal" /> | {meal.protein}g <UnitText unit=" P" /> | {meal.carbs}g <UnitText unit=" C" /> | {meal.fat}g <UnitText unit=" F" />
    </p>
  )
}

export default MacroSummaryText;