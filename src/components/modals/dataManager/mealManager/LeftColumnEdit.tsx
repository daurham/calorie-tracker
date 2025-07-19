import { useState } from "react";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea, Collapsible, CollapsibleTrigger, CollapsibleContent, NutritionalSummaryCard } from "@/components/ui";
import { useMealManagement } from "./MealManagementContext";

const LeftColumnEdit = () => {
  const {
    formData,
    setFormData,
    resetForm,
    setMealType,
    setOriginalIngredients,
    originalIngredients,
    originalStandaloneMacros,
    setOriginalStandaloneMacros,
    isLoading,
    handleSubmit,
    notesCollapsed,
    setNotesCollapsed,
    instructionsCollapsed,
    setInstructionsCollapsed,
    handleIngredientChange,
    availableIngredients,
    handleRemoveIngredient,
    handleAddIngredient,
    calculateTotals,
    editModeTotals
  } = useMealManagement();

  // Local state to track input values for better UX
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Edit Meal
        </h3>
        <Button variant="ghost" onClick={resetForm}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Protein Power Bowl"
          />
        </div>

        {/* Meal Type */}
        <div>
          <Label htmlFor="meal-type">Meal Type</Label>
          <Select
            value={formData.meal_type}
            onValueChange={(value) => {
              const newMealType = value as 'composed' | 'standalone';
              setMealType(newMealType);

              if (newMealType === 'standalone') {
                // Store current ingredients before clearing them
                setOriginalIngredients(formData.ingredients);
                // Calculate total macros from all ingredients
                const totalMacros = calculateTotals(formData.ingredients);
                // Store the calculated macros as original standalone macros
                setOriginalStandaloneMacros(totalMacros);
                setFormData(prev => ({
                  ...prev,
                  meal_type: newMealType,
                  ingredients: [],
                  calories: totalMacros.calories,
                  protein: totalMacros.protein,
                  carbs: totalMacros.carbs,
                  fat: totalMacros.fat,
                }));
              } else {
                // Restore original ingredients when switching back to composed
                setFormData(prev => ({
                  ...prev,
                  meal_type: newMealType,
                  ingredients: originalIngredients,
                  // Clear macros when switching to composed
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                }));
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a meal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="composed">Composed</SelectItem>
              <SelectItem value="standalone">Standalone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ingredients List - Only for Composed Meals */}
        {formData.meal_type === 'composed' && (
          <div>
            <Label>Ingredients</Label>
            <div className="space-y-2">
              {formData.ingredients.filter(ingredient => ingredient && ingredient.id).map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0 relative">
                    <select
                      value={ingredient.id.toString()}
                      onChange={(e) => handleIngredientChange(index, 'id', parseInt(e.target.value))}
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
                        availableIngredients.map(ing => (
                          <option key={ing.id} value={ing.id.toString()}>
                            {ing.name}
                          </option>
                        ))
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
                    value={inputValues[`${index}`] ?? (ingredient.quantity === 0 ? '' : ingredient.quantity.toString())}
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
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={handleAddIngredient} disabled={isLoading}>
                Add Ingredient
              </Button>
            </div>
          </div>
        )}

        {/* Macro Inputs - Only for Standalone Meals */}
        {formData.meal_type === 'standalone' && (
          <div className="space-y-4">
            <Label>Nutritional Information</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      calories: value === '' ? 0 : parseInt(value) || 0
                    }));
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.protein || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      protein: value === '' ? 0 : parseFloat(value) || 0
                    }));
                  }}
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.carbs || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      carbs: value === '' ? 0 : parseFloat(value) || 0
                    }));
                  }}
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.fat || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      fat: value === '' ? 0 : parseFloat(value) || 0
                    }));
                  }}
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <Collapsible open={!notesCollapsed} onOpenChange={(open) => setNotesCollapsed(!open)}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between p-1 h-auto font-normal"
            >
              <Label htmlFor="notes" className="cursor-pointer">Notes (optional)</Label>
              {notesCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, notes: e.target.value }));
                // Auto-expand when user starts typing
                if (e.target.value && notesCollapsed) {
                  setNotesCollapsed(false);
                }
              }}
              placeholder="Any additional notes about this meal..."
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Instructions */}
        <Collapsible open={!instructionsCollapsed} onOpenChange={(open) => setInstructionsCollapsed(!open)}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between p-1 h-auto font-normal"
            >
              <Label htmlFor="instructions" className="cursor-pointer">Instructions (optional)</Label>
              {instructionsCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, instructions: e.target.value }));
                // Auto-expand when user starts typing
                if (e.target.value && instructionsCollapsed) {
                  setInstructionsCollapsed(false);
                }
              }}
              placeholder="Preparation instructions..."
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Nutritional Summary */}
        <NutritionalSummaryCard totals={editModeTotals} />

        {/* Buttons */}
        <div className="flex gap-2">
          <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={isLoading}>
            Update
          </Button>
          <Button type="button" className="bg-blue-500 hover:bg-blue-600"
            onClick={(e) => handleSubmit(e, true)} disabled={isLoading}>
            Add as New
          </Button>
          <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LeftColumnEdit;