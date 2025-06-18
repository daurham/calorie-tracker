import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronRight
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Card, CardContent, 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui";
import { MealCombo, MealComboInput, Ingredient } from '@/lib/api-client';
import { formatMacros } from '@/lib/utils';

interface MealComboManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealCombos: MealCombo[];
  availableIngredients: Ingredient[];
  onAddMealCombo: (mealCombo: MealComboInput) => Promise<void>;
  onUpdateMealCombo: (id: number, mealCombo: MealComboInput) => Promise<void>;
  onDeleteMealCombo: (id: number) => Promise<void>;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  mealId: number | null;
}

const MealComboManagementDialog = ({
  open,
  onOpenChange,
  mealCombos,
  availableIngredients,
  onAddMealCombo,
  onUpdateMealCombo,
  onDeleteMealCombo,
  macroGoals,
  mealId
}: MealComboManagementDialogProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notesCollapsed, setNotesCollapsed] = useState(true);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(true);
  const [formData, setFormData] = useState<{
    name: string;
    ingredients: Array<{ id: number; name: string; quantity: number }>;
    notes: string;
    instructions: string;
  }>({
    name: '',
    ingredients: [],
    notes: '',
    instructions: '',
  });

  useEffect(() => {
    if (mealId !== null) {
      setEditingId(mealId);
      const mealCombo = mealCombos.find(mc => mc.id === mealId);
      if (mealCombo) {
        setFormData({
          name: mealCombo.name,
          ingredients: mealCombo.ingredients.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity
          })),
          notes: mealCombo.notes || '',
          instructions: mealCombo.instructions || '',
        });
        setIsAdding(true);
      }
    }
  }, [mealId, mealCombos]);

  const handleAddIngredient = () => {
    const firstIngredient = availableIngredients[0];
    if (firstIngredient) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, {
          id: firstIngredient.id,
          name: firstIngredient.name,
          quantity: 1
        }],
      }));
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleIngredientChange = (index: number, field: 'id' | 'quantity', value: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i === index) {
          if (field === 'id') {
            const ingredient = availableIngredients.find(ing => ing.id === value);
            return {
              id: value,
              name: ingredient?.name || '',
              quantity: ing.quantity
            };
          }
          return { ...ing, [field]: value };
        }
        return ing;
      }),
    }));
  };

  const calculateTotals = () => {
    const totals = formData.ingredients.reduce(
      (acc, { id, quantity }) => {
        const ingredient = availableIngredients.find(i => i.id === id);
        if (ingredient) {
          const ratio = Number(quantity);
          acc.calories += Number(ingredient.calories) * ratio;
          acc.protein += Number(ingredient.protein) * ratio;
          acc.carbs += Number(ingredient.carbs) * ratio;
          acc.fat += Number(ingredient.fat) * ratio;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return totals;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotals();

    try {
      const mealComboData: MealComboInput = {
        name: formData.name,
        ingredients: formData.ingredients.map(({ id, quantity }) => ({ id, quantity })),
        notes: formData.notes,
        instructions: formData.instructions,
        ...totals,
      };

      if (editingId !== null) {
        await onUpdateMealCombo(editingId, mealComboData);
        toast({
          title: 'Success',
          description: 'Meal combo updated successfully',
        });
      } else {
        await onAddMealCombo(mealComboData);
        toast({
          title: 'Success',
          description: 'Meal combo added successfully',
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving meal combo", error);
      toast({
        title: 'Error',
        description: 'Failed to save meal combo',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (mealCombo: MealCombo) => {
    setEditingId(mealCombo.id);
    setFormData({
      name: mealCombo.name,
      ingredients: mealCombo.ingredients.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity
      })),
      notes: mealCombo.notes || '',
      instructions: mealCombo.instructions || '',
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await onDeleteMealCombo(id);
      toast({
        title: 'Success',
        description: 'Meal combo deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meal combo',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ingredients: [],
      notes: '',
      instructions: '',
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Manage Meal Combos
          </DialogTitle>
          <DialogDescription>
            Add, edit, or remove meal combos from your database.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingId ? "Edit Meal Combo" : "Add New Meal Combo"}
              </h3>
              {isAdding && (
                <Button variant="ghost" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isAdding ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Protein Power Bowl"
                  />
                </div>

                <div>
                  <Label>Ingredients</Label>
                  <div className="space-y-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={ingredient.id.toString()}
                          onValueChange={value => handleIngredientChange(index, 'id', parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableIngredients.map(ing => (
                              <SelectItem key={ing.id} value={ing.id.toString()}>
                                {ing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={ingredient.quantity}
                          onChange={e => handleIngredientChange(index, 'quantity', parseFloat(e.target.value))}
                          min="0"
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
                    <Button type="button" onClick={handleAddIngredient}>
                      Add Ingredient
                    </Button>
                  </div>
                </div>

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
                      placeholder="Any additional notes about this combo..."
                    />
                  </CollapsibleContent>
                </Collapsible>

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

                {formData.ingredients.length > 0 && (
                  <Card className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Nutritional Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
                          <div className="text-sm opacity-90">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatMacros(totals.protein, macroGoals.protein).protein}</div>
                          <div className="text-sm opacity-90">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatMacros(totals.carbs, macroGoals.carbs).carbs}</div>
                          <div className="text-sm opacity-90">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatMacros(totals.fat, macroGoals.fat).fat}</div>
                          <div className="text-sm opacity-90">Fat</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    {editingId ? "Update" : "Add"} Meal Combo
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setIsAdding(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Meal Combo
              </Button>
            )}
          </div>

          {/* Right Column - Meal Combos List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Meal Combos</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {mealCombos.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No meal combos added yet
                </p>
              ) : (
                mealCombos.map((combo) => (
                  <Card key={combo.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{combo.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {combo.ingredients.map(i => `${i.name} (${i.quantity})`).join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(combo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(combo.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MealComboManagementDialog; 