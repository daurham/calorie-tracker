import { useState } from "react";
import { X } from "lucide-react";
import {
  Label,
  NutritionalSummaryCard,
  Card,
  CardContent,
  Button,
  Input,
} from "@/components/ui";
import { useMealManagement } from "./MealManagementContext";

const RightColumnAdd = () => {
  const {
    selectedIngredients,
    removeIngredient,
    updateQuantity,
    addModeTotals
  } = useMealManagement();

  // Local state to track input values for better UX
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  return (
    <div className="space-y-6">
      {/* Selected Ingredients */}
      <div>
        <Label>Selected Ingredients</Label>
        <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
          {selectedIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No ingredients selected yet
            </p>
          ) : (
            selectedIngredients.map((ingredient) => (
              // Ingredient card
              <Card key={ingredient.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{ingredient.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(ingredient.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={inputValues[ingredient.id] ?? (ingredient.quantity === 0 ? '' : ingredient.quantity.toString())}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Update local input state immediately for responsive UX
                        setInputValues(prev => ({
                          ...prev,
                          [ingredient.id]: value
                        }));
                        
                        // Only update the actual quantity if it's a valid number
                        if (value === '' || value === '.') {
                          updateQuantity(ingredient.id, 0);
                        } else if (/^\d*\.?\d*$/.test(value)) {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            updateQuantity(ingredient.id, numValue);
                          }
                        }
                      }}
                      onBlur={() => {
                        // Clean up local state when input loses focus
                        setInputValues(prev => {
                          const newState = { ...prev };
                          delete newState[ingredient.id];
                          return newState;
                        });
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {ingredient.unit}
                    </span>
                    <span className="text-sm font-medium ml-auto">
                      {(() => {
                        const calories = ingredient.calories * ingredient.quantity;
                        return isNaN(calories) || calories <= 0 ? '—' : `${Math.round(calories)} cal`;
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Nutritional Summary */}
      {selectedIngredients.length > 0 && (
        <NutritionalSummaryCard totals={addModeTotals} />
      )}
    </div>
  );
};

export default RightColumnAdd;