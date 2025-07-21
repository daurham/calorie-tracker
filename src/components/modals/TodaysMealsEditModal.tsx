import { useState, useEffect } from "react";
import { X, Copy, Edit3, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { generateUniqueId } from "@/lib/utils";
import MacroSummaryText from "../MacroSummaryText";
import IngredientEditor from "../ui/IngredientEditor";
import { MealType } from "@/types";

interface TodaysMealsEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: any[];
  editingMeal: any;
  availableIngredients: any[];
  onUpdateMeal: (updatedMeal: any) => void;
  onDuplicateMeal: (duplicatedMeal: any) => void;
  onRemoveMeal: (id: any) => void;
  onUpdateEditingMeal?: (updatedMeal: any) => void;
}

const TodaysMealsEditModal = ({
  open,
  onOpenChange,
  meals,
  editingMeal,
  availableIngredients,
  onUpdateMeal,
  onDuplicateMeal,
  onRemoveMeal,
  onUpdateEditingMeal,
}: TodaysMealsEditModalProps) => {
  const [editMode, setEditMode] = useState<MealType | null>(null);

  // Set edit mode when editingMeal changes
  useEffect(() => {
    if (editingMeal) {
      if (editingMeal.meal_type === 'mod') {
        setEditMode('mod');
      } else if (editingMeal.meal_type === 'composed') {
        setEditMode('composed');
      } else if (editingMeal.meal_type === 'standalone') {
        setEditMode('standalone');
      }
    } else {
      setEditMode(null);
    }
  }, [editingMeal]);

  const handleEditMeal = (meal: any) => {
    onUpdateEditingMeal(meal);  
  };

  const handleCloseEdit = () => {
    setEditMode(null);
    onUpdateEditingMeal(null);
  }

  const handleDuplicateMeal = (meal: any) => {
    const duplicatedMeal = {
      ...meal,
      uniqueMealId: generateUniqueId(),
      timestamp: new Date().toLocaleTimeString(),
      isEdited: false, // Reset edited flag for duplicated meal
    };
    onDuplicateMeal(duplicatedMeal);
  };

  const handleUpdatePortion = (mealId: string, newPortion: number) => {
    const meal = meals.find(m => m.uniqueMealId === mealId);
    if (meal && !isNaN(newPortion) && newPortion > 0) {
      const currentPortion = Number(meal.portion) || 1;
      const updatedMeal = {
        ...meal,
        portion: newPortion,
        calories: Math.round((Number(meal.calories) / currentPortion) * newPortion),
        protein: Number(((Number(meal.protein) / currentPortion) * newPortion).toFixed(1)),
        carbs: Number(((Number(meal.carbs) / currentPortion) * newPortion).toFixed(1)),
        fat: Number(((Number(meal.fat) / currentPortion) * newPortion).toFixed(1)),
      };
      onUpdateMeal(updatedMeal);
      // Update the editing meal state if callback is provided
      if (onUpdateEditingMeal) {
        onUpdateEditingMeal(updatedMeal);
      }
      setEditMode(null);
    }
  };

  const handleUpdateIngredients = (mealId: string, updatedIngredients: any[]) => {
    const meal = meals.find(m => m.uniqueMealId === mealId);
    if (meal) {
      // Recalculate macros based on available ingredients data
      const totalMacros = updatedIngredients.reduce((totals, ingredient) => {
        const fullIngredient = availableIngredients.find(i => i.id === ingredient.id);
        if (fullIngredient && ingredient.id > 0) { // Only calculate for selected ingredients
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

      const currentPortion = Number(meal.portion) || 1;
      const updatedMeal = {
        ...meal,
        ingredients: updatedIngredients,
        calories: Math.round(totalMacros.calories * currentPortion),
        protein: Number((totalMacros.protein * currentPortion).toFixed(1)),
        carbs: Number((totalMacros.carbs * currentPortion).toFixed(1)),
        fat: Number((totalMacros.fat * currentPortion).toFixed(1)),
        isEdited: true,
      };
      onUpdateMeal(updatedMeal);
      // Update the editing meal state if callback is provided
      if (onUpdateEditingMeal) {
        onUpdateEditingMeal(updatedMeal);
      }
      setEditMode(null);
    }
  };

  const handleUpdateMod = (mealId: string, updatedModData: any) => {
    const meal = meals.find(m => m.uniqueMealId === mealId);
    if (meal) {
      const currentPortion = Number(meal.portion) || 1;
      const updatedMeal = {
        ...meal,
        modData: updatedModData,
        calories: Math.round(Number(updatedModData.calories || 0) * currentPortion),
        protein: Number((Number(updatedModData.protein || 0) * currentPortion).toFixed(1)),
        carbs: Number((Number(updatedModData.carbs || 0) * currentPortion).toFixed(1)),
        fat: Number((Number(updatedModData.fat || 0) * currentPortion).toFixed(1)),
        isEdited: true,
      };
      onUpdateMeal(updatedMeal);
      // Update the editing meal state if callback is provided
      if (onUpdateEditingMeal) {
        onUpdateEditingMeal(updatedMeal);
      }
      setEditMode(null);
    }
  };

  const TodaysMealCard = ({ meal }: { meal: any }) => (
    <div className="bg-gradient-to-r from-white to-emerald-50 dark:from-slate-800 dark:to-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded-lg p-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{meal.name}</h3>
                {meal.modData && (
                  <Sparkles className="h-3 w-3 text-purple-500" />
                )}
                {meal.portion && meal.portion !== 1 && (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                    {meal.portion === 0.5 ? '½' : 
                     meal.portion === 0.33 ? '⅓' : 
                     meal.portion === 0.25 ? '¼' : 
                     meal.portion === 0.75 ? '¾' :
                     meal.portion === 0.67 ? '⅔' :
                     `${Math.round(meal.portion * 100)}%`}
                  </span>
                )}
                {meal.isEdited && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Edited
                  </span>
                )}
              </div>
              {meal.timestamp && (
                <span className="text-xs sm:text-sm text-muted-foreground bg-white dark:bg-slate-700 px-2 py-1 rounded w-fit">
                  {meal.timestamp}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
              {meal.ingredients?.map((i: any) => i.name).join(", ")}
              {meal.weight && (
                <span className="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                  ({meal.weight}g)
                </span>
              )}
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {meal.calories}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">calories</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <MacroSummaryText data={meal} showCalories={false} />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditMeal(meal)}
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 px-2 h-8"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicateMeal(meal)}
              className="text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 px-2 h-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveMeal(meal.uniqueMealId)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 px-2 h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const CompactPortionEditor = ({ meal, onPortionChange }: { meal: any; onPortionChange: (portion: number) => void }) => {
    const [portion, setPortion] = useState(meal.portion || 1);

    const handlePortionChange = (newPortion: number) => {
      setPortion(newPortion);
      onPortionChange(newPortion);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Portion Size</h4>
          <div className="flex gap-1">
            {[0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2].map((p) => (
              <Button
                key={p}
                variant={portion === p ? "default" : "outline"}
                size="sm"
                onClick={() => handlePortionChange(p)}
                className="text-xs px-2 py-1 h-6"
              >
                {p === 0.25 ? '¼' : 
                 p === 0.33 ? '⅓' : 
                 p === 0.5 ? '½' : 
                 p === 0.67 ? '⅔' : 
                 p === 0.75 ? '¾' : 
                 p.toString()}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <input
            type="number"
            value={portion}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const newPortion = isNaN(value) ? 1 : value;
              handlePortionChange(newPortion);
            }}
            min="0.1"
            max="5"
            step="0.01"
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Custom portion"
          />
        </div>
      </div>
    );
  };

  const PortionEditor = ({ meal }: { meal: any }) => {
    const [portion, setPortion] = useState(meal.portion || 1);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Portion</h3>
          <Button variant="ghost" onClick={handleCloseEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CompactPortionEditor 
          meal={meal} 
          onPortionChange={(newPortion) => handleUpdatePortion(meal.uniqueMealId, newPortion)} 
        />

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Updated Macros:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Calories: <span className="font-medium">{Math.round((Number(meal.calories) / (Number(meal.portion) || 1)) * portion)}</span></div>
            <div>Protein: <span className="font-medium">{((Number(meal.protein) / (Number(meal.portion) || 1)) * portion).toFixed(1)}g</span></div>
            <div>Carbs: <span className="font-medium">{((Number(meal.carbs) / (Number(meal.portion) || 1)) * portion).toFixed(1)}g</span></div>
            <div>Fat: <span className="font-medium">{((Number(meal.fat) / (Number(meal.portion) || 1)) * portion).toFixed(1)}g</span></div>
          </div>
        </div>
      </div>
    );
  };


  const ComposedMealEditor = ({ meal }: { meal: any }) => {
    // Transform meal ingredients to the format expected by IngredientEditor
    const transformIngredients = (mealIngredients: any[]) => {
      return mealIngredients.map(ing => ({
        id: ing.id || 0,
        name: ing.name || '',
        quantity: ing.quantity || 1,
        calories: ing.calories || 0,
        protein: ing.protein || 0,
        carbs: ing.carbs || 0,
        fat: ing.fat || 0,
      }));
    };

    const [ingredients, setIngredients] = useState(transformIngredients(meal.ingredients || []));
    const [currentPortion, setCurrentPortion] = useState(Number(meal.portion) || 1);

    const handleIngredientsChange = (updatedIngredients: any[]) => {
      setIngredients(updatedIngredients);
    };

    const handlePortionChange = (newPortion: number) => {
      setCurrentPortion(newPortion);
      // Update the meal immediately with new portion
      const updatedMeal = {
        ...meal,
        portion: newPortion,
        calories: Math.round((Number(meal.calories) / (Number(meal.portion) || 1)) * newPortion),
        protein: Number(((Number(meal.protein) / (Number(meal.portion) || 1)) * newPortion).toFixed(1)),
        carbs: Number(((Number(meal.carbs) / (Number(meal.portion) || 1)) * newPortion).toFixed(1)),
        fat: Number(((Number(meal.fat) / (Number(meal.portion) || 1)) * newPortion).toFixed(1)),
      };
      onUpdateMeal(updatedMeal);
      if (onUpdateEditingMeal) {
        onUpdateEditingMeal(updatedMeal);
      }
    };

    // Check if all ingredients are properly selected (have valid IDs)
    const hasUnselectedIngredients = ingredients.some(ingredient => !ingredient.id || ingredient.id === 0);

    // Edit Composed Meal
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Composed Meal</h3>
          <Button variant="ghost" onClick={handleCloseEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Portion Editor */}
        <div className="bg-muted p-4 rounded-lg">
          <CompactPortionEditor 
            meal={meal} 
            onPortionChange={handlePortionChange} 
          />
        </div>
        
        <IngredientEditor
          ingredients={ingredients}
          availableIngredients={availableIngredients}
          onIngredientsChange={handleIngredientsChange}
          portion={currentPortion}
        />

        <Button 
          onClick={() => handleUpdateIngredients(meal.uniqueMealId, ingredients)}
          disabled={hasUnselectedIngredients}
          className="w-full"
        >
          Update Ingredients
        </Button>
      </div>
    );
  };

  const ModEditor = ({ meal }: { meal: any }) => {
    const [inputs, setInputs] = useState<Record<string, any>>(meal.modData?.inputs || {});
    const [calculation, setCalculation] = useState<{
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    } | null>(null);
    const [currentPortion, setCurrentPortion] = useState(Number(meal.portion) || 1);

    // Initialize with existing mod data
    useEffect(() => {
      if (meal.modData) {
        setInputs(meal.modData.inputs || {});
        if (meal.modData.calculation) {
          setCalculation(meal.modData.calculation);
        }
      }
    }, [meal]);

    const handleInputChange = (key: string, value: any) => {
      const newInputs = {
        ...inputs,
        [key]: value
      };
      setInputs(newInputs);
      
      // For now, we'll use a simple calculation based on the original mod data
      // In a full implementation, this would use the actual mod.calculate function
      if (meal.modData && meal.modData.calculation) {
        const multiplier = value / (inputs[key] || 1);
        setCalculation({
          calories: Math.round(meal.modData.calculation.calories * multiplier),
          protein: Number((meal.modData.calculation.protein * multiplier).toFixed(1)),
          carbs: Number((meal.modData.calculation.carbs * multiplier).toFixed(1)),
          fat: Number((meal.modData.calculation.fat * multiplier).toFixed(1)),
        });
      }
    };

    const handlePortionChange = (newPortion: number) => {
      setCurrentPortion(newPortion);
      // Update the meal immediately with new portion
      const updatedMeal = {
        ...meal,
        portion: newPortion,
        calories: Math.round((Number(meal.calories) / (Number(meal.portion) || 1)) * newPortion),
        protein: Number(((Number(meal.protein) / (Number(meal.portion) || 1)) * newPortion).toFixed(1)),
        carbs: Number(((Number(meal.carbs) / (Number(meal.portion) || 1)) * newPortion).toFixed(1)),
        fat: Number(((Number(meal.fat) / (Number(meal.portion) || 1)) * newPortion).toFixed(1)),
      };
      onUpdateMeal(updatedMeal);
      if (onUpdateEditingMeal) {
        onUpdateEditingMeal(updatedMeal);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Mod Configuration</h3>
          <Button variant="ghost" onClick={handleCloseEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Portion Editor */}
          <div className="bg-muted p-4 rounded-lg">
            <CompactPortionEditor 
              meal={meal} 
              onPortionChange={handlePortionChange} 
            />
          </div>

          {/* Mod Inputs */}
          <div>
            <h4 className="font-medium mb-2">Mod Parameters</h4>
            <div className="space-y-3">
              {Object.entries(inputs).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-sm font-medium min-w-20">{key}:</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleInputChange(key, Number(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Enter value"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Results */}
          {calculation && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Updated Macros:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: <span className="font-medium">{Math.round(calculation.calories * currentPortion)}</span></div>
                <div>Protein: <span className="font-medium">{(calculation.protein * currentPortion).toFixed(1)}g</span></div>
                <div>Carbs: <span className="font-medium">{(calculation.carbs * currentPortion).toFixed(1)}g</span></div>
                <div>Fat: <span className="font-medium">{(calculation.fat * currentPortion).toFixed(1)}g</span></div>
              </div>
            </div>
          )}

          <Button 
            onClick={() => handleUpdateMod(meal.uniqueMealId, {
              ...meal.modData,
              inputs,
              calculation
            })}
            className="w-full"
          >
            Update Mod Configuration
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Edit Today's Meals
          </DialogTitle>
          <DialogDescription>
            Edit portions, ingredients, or mod configurations for your meals today.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Editor */}
          <div className="space-y-4">
            {editingMeal ? (
              editMode === 'standalone' ? (
                <PortionEditor meal={editingMeal} />
              ) : editMode === 'composed' ? (
                <ComposedMealEditor meal={editingMeal} />
              ) : editMode === 'mod' ? (
                <ModEditor meal={editingMeal} />
              ) : null
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a meal to edit
              </div>
            )}
          </div>

          {/* Right Column - Meals List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Today's Meals</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {meals.map((meal) => (
                <TodaysMealCard key={meal.uniqueMealId} meal={meal} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TodaysMealsEditModal; 