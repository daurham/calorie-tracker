import { Meal } from '@/types';

const UnitText = ({ unit }: { unit: string }) => {
  // Remove any whitespace from the unit
  const trimmedUnit = unit.replace(/\s/g, '');
  return (
    <span className="text-xs text-muted-foreground text-emerald-600 dark:text-emerald-400">
      {trimmedUnit}
    </span>
  );
}

const IngredientsSummaryText = ({ meal }: { meal: Meal }) => {
  return (
    <p className="text-sm text-muted-foreground">
      {meal.ingredients.map((ingredient, index) => (
        <span key={ingredient.id}>
          {ingredient.quantity > 1 
            ? `${ingredient.name} (${ingredient.quantity}) `
            : `${ingredient.name} `
          }
          <UnitText unit={ingredient.unit} />
          {index < meal.ingredients.length - 1 && ", "}
        </span>
      ))}
    </p>
  );
}

export default IngredientsSummaryText;