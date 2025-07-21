import { Meal } from '@/types';

const Highlighter = ({ text }: { text: string }) => {
  // Remove all spaces from the text
  // const trimmedUnit = text.replace(/\s/g, '');
  return (
    <span className="text-xs text-emerald-600 dark:text-emerald-400">
      {text}
    </span>
  );
}


const IngredientListSummaryText = ({ meal }: { meal: Meal }) => {
  return (
    <p className="text-sm">
      {meal.ingredients.map((ingredient, index) => (
        <span key={ingredient.id}>
          {ingredient.quantity !== 1
            ? (<>{`${ingredient.name} (${ingredient.quantity})`}&nbsp;&times;&nbsp;</>)
            : `${ingredient.name} `
          }
          <Highlighter text={ingredient.unit} />
          {index < meal.ingredients.length - 1 && ", "}
        </span>
      ))}
    </p>
  );
}

export default IngredientListSummaryText;