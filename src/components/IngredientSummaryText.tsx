import { Ingredient } from '@/types';

const Highlighter = ({ text }: { text: string }) => {
  // Remove all spaces from the text
  // const trimmedUnit = text.replace(/\s/g, '');
  return (
    <span className="text-xs text-emerald-600 dark:text-emerald-400">
      {text}
    </span>
  );
}


const IngredientSummaryText = ({ ing }: { ing: Ingredient }) => {
  return (
    <p className="text-sm text-muted-foreground">
      <Highlighter text={`${ing.calories} calories`} /> per <Highlighter text={ing.unit} />
    </p>
  );
}

export default IngredientSummaryText;