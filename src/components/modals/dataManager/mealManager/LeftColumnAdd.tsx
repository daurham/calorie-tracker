import { X, Plus, ChevronRight, ChevronDown } from "lucide-react";
import { 
  Button, 
  Input, 
  Label, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem, 
  Textarea, 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent, 
  SearchBar, 
  Card, 
  CardContent,
 } from "@/components/ui";
import { IngredientSkeleton } from "@/components/skeletons";
import { useMealManagement } from "./MealManagementContext";

const LeftColumnAdd = () => {
  const {
    formData,
    setFormData,
    resetForm,
    setMealType,
    setOriginalIngredients,
    originalIngredients,
    searchQuery,
    setSearchQuery,
    isLoading,
    filteredIngredients,
    addIngredient,
    handleSubmit,
    handleDialogClose,
    notesCollapsed,
    setNotesCollapsed,
    instructionsCollapsed,
    setInstructionsCollapsed,
    addModeTotals
  } = useMealManagement();

  return (
  <div className="space-y-6 min-h-[65vh]">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">
        Add New Meal
      </h3>
      <Button variant="ghost" onClick={resetForm}>
        <X className="h-4 w-4" />
      </Button>
    </div>

    {/* Name */}
    <div>
      <Label htmlFor="meal-name">Meal Name</Label>
      <Input
        id="meal-name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="e.g., Protein Power Bowl"
        className="mt-1"
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
            setFormData(prev => ({
              ...prev,
              meal_type: newMealType,
              ingredients: [],
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

    {/* Ingredients - Only for Composed Meals */}
    {formData.meal_type === 'composed' && (
      <div>
        <Label>Available Ingredients</Label>
        <div className="mt-2 max-h-60 overflow-y-auto">
          {/* Search Bar - Sticky */}
          <div className="sticky top-0 z-10 bg-background pb-2">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>

          <div className="grid gap-2">
            {isLoading ? (
              // Show loading skeletons for ingredients
              Array.from({ length: 6 }).map((_, index) => (
                <IngredientSkeleton key={index} index={index} />
              ))
            ) : (
              filteredIngredients.map((ingredient) => (
                <Card
                  key={ingredient.id}
                  className="cursor-pointer hover:bg-emerald-50 bg-emerald-50 dark:hover:bg-emerald-950 dark:bg-emerald-900 transition-all duration-200 active:scale-95 active:bg-emerald-100 dark:active:bg-emerald-800"
                  onClick={() => addIngredient(ingredient)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{ingredient.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ingredient.calories} cal per {ingredient.unit}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
              value={formData.calories}
              onChange={(e) => setFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              value={formData.protein}
              onChange={(e) => setFormData(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              step="0.1"
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={formData.carbs}
              onChange={(e) => setFormData(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              step="0.1"
            />
          </div>
          <div>
            <Label htmlFor="fat">Fat (g)</Label>
            <Input
              id="fat"
              type="number"
              value={formData.fat}
              onChange={(e) => setFormData(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
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
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
          onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          placeholder="Preparation instructions..."
        />
      </CollapsibleContent>
    </Collapsible>

    {/* Buttons */}
    <div className="flex gap-2 pt-4">
      <Button onClick={() => handleSubmit()} className="bg-emerald-500 hover:bg-emerald-600" disabled={isLoading}>
        Save Meal
      </Button>
      <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={isLoading}>
        Cancel
      </Button>
    </div>
  </div>
  );
};

export default LeftColumnAdd;