import { useState } from "react";
import { X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface IngredientEditorProps {
  ingredients: Ingredient[];
  availableIngredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  isLoading?: boolean;
  showMacros?: boolean;
  portion?: number;
}

const IngredientEditor = ({
  ingredients,
  availableIngredients,
  onIngredientsChange,
  isLoading = false,
  showMacros = true,
  portion = 1
}: IngredientEditorProps) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleIngredientChange = (index: number, field: 'id' | 'quantity', value: any) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
    };
    onIngredientsChange(updatedIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(updatedIngredients);
  };

  const handleAddIngredient = () => {
    // Add a placeholder ingredient that will be replaced when user selects one
    const newIngredient: Ingredient = {
      id: 0, // Will be set when user selects an ingredient
      name: '',
      quantity: 1,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    onIngredientsChange([...ingredients, newIngredient]);
  };

  const calculateTotals = () => {
    return ingredients.reduce((totals, ingredient) => {
      const fullIngredient = availableIngredients.find(i => i.id === ingredient.id);
      if (fullIngredient) {
        const multiplier = ingredient.quantity;
        return {
          calories: totals.calories + (fullIngredient.calories * multiplier),
          protein: totals.protein + (fullIngredient.protein * multiplier),
          carbs: totals.carbs + (fullIngredient.carbs * multiplier),
          fat: totals.fat + (fullIngredient.fat * multiplier),
        };
      }
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      {/* Ingredients List */}
      <div>
        <Label>Ingredients</Label>
        <div className="space-y-2">
          {ingredients.filter(ingredient => ingredient).map((ingredient, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1 min-w-0 relative">
                <select
                  value={ingredient?.id?.toString() || ""}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    const selectedIngredient = availableIngredients.find(ing => ing.id === selectedId);
                    if (selectedIngredient) {
                      handleIngredientChange(index, 'id', selectedId);
                      // Also update the ingredient data with the selected ingredient's macros
                      const updatedIngredient = {
                        ...ingredient,
                        id: selectedId,
                        name: selectedIngredient.name,
                        calories: selectedIngredient.calories,
                        protein: selectedIngredient.protein,
                        carbs: selectedIngredient.carbs,
                        fat: selectedIngredient.fat,
                      };
                      const updatedIngredients = [...ingredients];
                      updatedIngredients[index] = updatedIngredient;
                      onIngredientsChange(updatedIngredients);
                    }
                  }}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  style={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isLoading ? (
                    <option value="" disabled>
                      Loading ingredients...
                    </option>
                  ) : (
                    <>
                      <option value="">Select an ingredient...</option>
                      {availableIngredients.map(ing => (
                        <option key={ing.id} value={ing?.id?.toString()}>
                          {ing.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <Input
                type="number"
                value={inputValues[`${index}`] ?? (ingredient?.quantity === 0 ? '' : (ingredient?.quantity?.toString() || "1"))}
                onChange={e => {
                  const value = e.target.value;
                  // Update local input state immediately for responsive UX
                  setInputValues(prev => ({
                    ...prev,
                    [`${index}`]: value
                  }));
                  
                  // Only update the actual quantity if it's a valid number
                  if (value === '' || value === '.') {
                    handleIngredientChange(index, 'quantity', 0);
                  } else if (/^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      handleIngredientChange(index, 'quantity', numValue);
                    }
                  }
                }}
                onBlur={() => {
                  // Clean up local state when input loses focus
                  setInputValues(prev => {
                    const newState = { ...prev };
                    delete newState[`${index}`];
                    return newState;
                  });
                }}
                step="0.1"
                className="w-24"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveIngredient(index)}
                className="px-2 h-8"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button type="button" onClick={handleAddIngredient} disabled={isLoading}>
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Macros Summary */}
      {showMacros && (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Updated Macros:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Calories: <span className="font-medium">{Math.round(totals.calories * portion)}</span></div>
            <div>Protein: <span className="font-medium">{(totals.protein * portion).toFixed(1)}g</span></div>
            <div>Carbs: <span className="font-medium">{(totals.carbs * portion).toFixed(1)}g</span></div>
            <div>Fat: <span className="font-medium">{(totals.fat * portion).toFixed(1)}g</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientEditor; 