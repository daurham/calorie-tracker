import { Ingredient, Meal } from "@/types";

const UnitText = ({ unit }: { unit: string }) => {
  return (
    <span className="text-xs text-muted-foreground text-yellow-600 dark:text-yellow-400">
      {unit}
    </span>
  );
}

const MacroSummaryText = ({ data, showCalories = false }: { data: Meal | Ingredient, showCalories?: boolean }) => {
  return (
    <p className="text-xs text-muted-foreground">
      {showCalories && <span>Calories: <UnitText unit={`${data.calories}`} /> </span>}
      <span>Protein: <UnitText unit={`${data.protein}g`} /> </span>
      <span>Carbs: <UnitText unit={`${data.carbs}g`} /> </span>
      <span>Fat: <UnitText unit={`${data.fat}g`} /> </span>
      {/* {meal.calories} <UnitText unit="cal" /> | {meal.protein}g <UnitText unit=" P" /> | {meal.carbs}g <UnitText unit=" C" /> | {meal.fat}g <UnitText unit=" F" /> */}
    </p>
  )
}

export default MacroSummaryText;