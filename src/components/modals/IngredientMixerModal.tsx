import { useState, useEffect } from 'react';
import { ChefHat, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { PortionSelector } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';
import { Ingredient } from '@/types';
import BaseModModal from './BaseModModal';

interface CustomMealComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
  availableIngredients: Ingredient[];
}

interface SelectedIngredient {
  id: number;
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
}

const IngredientMixerModal = ({ 
  open, 
  onOpenChange, 
  mod, 
  onMealGenerated,
  availableIngredients 
}: CustomMealComposerModalProps) => {
  const [mealName, setMealName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [portionValid, setPortionValid] = useState(true);

  // Filter ingredients based on search term
  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const calculateTotals = () => {
    return selectedIngredients.reduce((totals, ingredient) => {
      const multiplier = ingredient.quantity;
      return {
        calories: totals.calories + (ingredient.calories * multiplier),
        protein: totals.protein + (ingredient.protein * multiplier),
        carbs: totals.carbs + (ingredient.carbs * multiplier),
        fat: totals.fat + (ingredient.fat * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totals = calculateTotals();

  const handleIngredientClick = (ingredient: Ingredient) => {
    const existingIndex = selectedIngredients.findIndex(ing => ing.id === ingredient.id);
    
    if (existingIndex >= 0) {
      // Ingredient already selected, increase quantity
      const updated = [...selectedIngredients];
      updated[existingIndex].quantity += 1;
      setSelectedIngredients(updated);
    } else {
      // New ingredient, add to selection
      const newIngredient: SelectedIngredient = {
        id: ingredient.id,
        name: ingredient.name,
        quantity: 1,
        calories: ingredient.calories,
        protein: ingredient.protein,
        carbs: ingredient.carbs,
        fat: ingredient.fat,
        unit: ingredient.unit || '',
      };
      setSelectedIngredients([...selectedIngredients, newIngredient]);
    }
  };

  const handleQuantityChange = (ingredientId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove ingredient if quantity is 0 or negative
      setSelectedIngredients(selectedIngredients.filter(ing => ing.id !== ingredientId));
    } else {
      // Update quantity
      setSelectedIngredients(selectedIngredients.map(ing => 
        ing.id === ingredientId ? { ...ing, quantity: newQuantity } : ing
      ));
    }
  };

  const isFormValid = () => {
    return mealName.trim() !== '' && selectedIngredients.length > 0 && portionValid;
  };

  const resetForm = () => {
    setMealName('');
    setSelectedIngredients([]);
    setSearchTerm('');
    setPortionValid(true);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <BaseModModal
      open={open}
      onOpenChange={onOpenChange}
      mod={mod}
      onMealGenerated={onMealGenerated}
      icon={<ChefHat className="h-5 w-5" />}
    >
      {(handleGenerateMeal, portion, setPortion) => {
        const finalTotals = {
          calories: Math.round(totals.calories * portion),
          protein: Math.round(totals.protein * portion * 10) / 10,
          carbs: Math.round(totals.carbs * portion * 10) / 10,
          fat: Math.round(totals.fat * portion * 10) / 10,
        };

        const handleSubmit = () => {
          const inputs = {
            mealName,
            portion,
            selectedIngredients
          };
          handleGenerateMeal(inputs);
          resetForm();
        };

        return (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Form */}
            <div className="space-y-4">
              {/* Meal Name */}
              <div className="space-y-2">
                <Label htmlFor="mealName">Meal Name</Label>
                <Input
                  id="mealName"
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Omelette with Extra Egg"
                  required
                />
              </div>

              {/* Search Ingredients */}
              <div className="space-y-2">
                <Label htmlFor="searchIngredients">Search Ingredients</Label>
                <Input
                  id="searchIngredients"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for ingredients..."
                />
              </div>

              {/* Available Ingredients */}
              <div className="space-y-2">
                <Label>Available Ingredients</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {filteredIngredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      onClick={() => handleIngredientClick(ingredient)}
                      className="p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-sm text-gray-500">
                          {ingredient.calories} cal, {ingredient.protein}g protein
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {ingredient.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portion Selection */}
              <PortionSelector 
                portion={portion} 
                setPortion={setPortion}
                onValidationChange={setPortionValid}
              />

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className="w-full"
              >
                Add to Today's Meals
              </Button>
            </div>

            {/* Right Column - Selected Ingredients & Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selected Ingredients</h3>
              
              {selectedIngredients.length === 0 ? (
                <p className="text-gray-500 text-sm">No ingredients selected. Click on ingredients to add them.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-sm text-gray-500">
                          {ingredient.calories * ingredient.quantity} cal, {ingredient.protein * ingredient.quantity}g protein
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(ingredient.id, ingredient.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{ingredient.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(ingredient.id, ingredient.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Macro Preview */}
              {selectedIngredients.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Updated Macros:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Calories: <span className="font-medium">{finalTotals.calories}</span></div>
                    <div>Protein: <span className="font-medium">{finalTotals.protein}g</span></div>
                    <div>Carbs: <span className="font-medium">{finalTotals.carbs}g</span></div>
                    <div>Fat: <span className="font-medium">{finalTotals.fat}g</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </BaseModModal>
  );
};

export default IngredientMixerModal;
