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
                    min="0.1"
                    step="0.1"
                    value={ingredient.quantity}
                    onChange={(e) => updateQuantity(ingredient.id, parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {ingredient.unit}
                  </span>
                  <span className="text-sm font-medium ml-auto">
                    {Math.round(ingredient.calories * ingredient.quantity)} cal
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