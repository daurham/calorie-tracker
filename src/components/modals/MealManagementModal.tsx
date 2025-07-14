import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";
import { useToast } from "@/hooks";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card, CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  NutritionalSummaryCard,
  Skeleton,
  SearchBar,
} from "@/components/ui";
import { DataManagementModal } from "@/components/modals";
import { MealCombo, MealComboInput, Ingredient } from '@/types';

interface MealManagementModalProps {
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
  isLoading?: boolean;
}

const MealManagementModal = ({
  open,
  onOpenChange,
  mealCombos,
  availableIngredients,
  onAddMealCombo,
  onUpdateMealCombo,
  onDeleteMealCombo,
  macroGoals,
  mealId,
  isLoading = false
}: MealManagementModalProps) => {
  const { toast } = useToast();
  const [comboName, setComboName] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [notes, setNotes] = useState("");
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [instructions, setInstructions] = useState("");
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

  const [searchQuery, setSearchQuery] = useState("");
  const filteredMealCombos = mealCombos.filter(combo =>
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    combo.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        // console.log("added meal:", mealCombo);
        // console.log("isAdding setting to true");
        // setIsAdding(true);
      }
    }
  }, [mealId, mealCombos]);

  useEffect(() => {
    if (isAdding) {
      setTotals(calculateTotals());
    } else {
      setTotals(calculateTotalsForm());
    }
  }, [isAdding]);

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

  const calculateTotalsForm = () => {
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

  const handleSubmit = async (e: React.FormEvent, addAsNew: boolean = false) => {
    e.preventDefault();
    if (mealCombos.find(mc => mc.name === formData.name) && addAsNew === true) {
      toast({
        title: "Meal already exists",
        description: "Please choose a different name.",
        variant: "destructive",
      });
      return;
    }
    if (formData.name === "" || formData.ingredients.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add a name and at least one ingredient.",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotalsForm();
    // Check if nothings changed
    if (addAsNew === false) {
      const mealCombo = mealCombos.find(mc => mc.name === formData.name);
      if (
        mealCombo &&
        mealCombo.ingredients.length === formData.ingredients.length &&
        mealCombo.ingredients.every((ing, index) => ing.id === formData.ingredients[index].id) &&
        mealCombo.notes === formData.notes &&
        mealCombo.instructions === formData.instructions &&
        mealCombo.calories == totals.calories &&
        mealCombo.protein == totals.protein &&
        mealCombo.carbs == totals.carbs &&
        mealCombo.fat == totals.fat
      ) {
        toast({
          title: "Nothing changed",
          description: "Please change something to update the meal.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const mealComboData: MealComboInput = {
        name: formData.name,
        ingredients: formData.ingredients.map(({ id, quantity }) => ({ id, quantity })),
        notes: formData.notes,
        instructions: formData.instructions,
        ...totals,
      };

      if (addAsNew === false) {
        await onUpdateMealCombo(editingId, mealComboData);
        toast({
          title: 'Success',
          description: 'Meal updated successfully',
        });
      } else {
        await onAddMealCombo(mealComboData);
        toast({
          title: 'Success',
          description: 'Meal added successfully',
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving meal", error);
      toast({
        title: 'Error',
        description: 'Failed to save meal',
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
    // setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await onDeleteMealCombo(id);
      toast({
        title: 'Success',
        description: 'Meal deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
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
    setSelectedIngredients([]);
    setNotes("");
    setInstructions("");
    setEditingId(null);
    setIsAdding(false);
    setSearchQuery("");
  };

  // const totals = calculateTotalsForm(); // used on edit

  // Add Functionality:
  const addIngredient = (ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 1 }]);
      calculateTotals
    }
  };

  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== ingredientId));
  };

  const updateQuantity = (ingredientId, quantity) => {
    setSelectedIngredients(selectedIngredients.map(i =>
      i.id === ingredientId ? { ...i, quantity: Math.max(0.1, quantity) } : i
    ));
  };

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

  const handleSave = () => {
    if (!comboName || selectedIngredients.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add a name and at least one ingredient.",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    const newCombo = {
      name: comboName,
      ingredients: selectedIngredients.map(ing => ({
        id: ing.id,
        quantity: ing.quantity
      })),
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      notes,
      instructions
    };
    onAddMealCombo(newCombo);

    toast({
      title: "Meal created!",
      description: `${comboName} has been saved to your meals.`,
    });

    // Reset form
    setComboName("");
    setSelectedIngredients([]);
    setNotes("");
    setInstructions("");
    onOpenChange(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // const totals = calculateTotals(); // used on add
  // useEffect(() => {
  //   console.log("isAdding", isAdding);
  // }, [isAdding]);


  const IngredientSkeleton = (index) => (
    <Card key={index} className="bg-emerald-50 dark:bg-emerald-900">
      <CardContent className="p-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )

  // Loading skeleton for meals
  const MealSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Shows edit form
  const leftColumnEdit = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Edit Meal
        </h3>
        <Button variant="ghost" onClick={resetForm}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Ingredients List */}
        <div>
          <Label>Ingredients</Label>
          <div className="space-y-2">
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={ingredient.id.toString()}
                  onValueChange={value => handleIngredientChange(index, 'id', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="" disabled>
                        Loading ingredients...
                      </SelectItem>
                    ) : (
                      availableIngredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id.toString()}>
                          {ing.name}
                        </SelectItem>
                      ))
                    )}
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
            <Button type="button" onClick={handleAddIngredient} disabled={isLoading}>
              Add Ingredient
            </Button>
          </div>
        </div>

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

        {/* Nutritional Summary */}
        {formData.ingredients.length > 0 && (
          <NutritionalSummaryCard totals={calculateTotalsForm()} />
        )}

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
  )

  const leftColumnNeutral = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Add New Meal
        </h3>
      </div>
      <Button onClick={() => setIsAdding(true)} className="w-full" disabled={isLoading}>
        <Plus className="h-4 w-4 mr-2" />
        Add New Meal
      </Button>
    </div>
  )

  // Shows add form
  const leftColumnAdd = (
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
          value={comboName}
          onChange={(e) => setComboName(e.target.value)}
          placeholder="e.g., Protein Power Bowl"
          className="mt-1"
        />
      </div>

      {/* Ingredients */}
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

      {/* Notes */}
      {/* <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this meal..."
                className="mt-1"
              />
            </div> */}
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
      {/* <div>
              <Label htmlFor="instructions">Instructions (optional)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Preparation instructions..."
                className="mt-1"
              />
            </div> */}
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
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" disabled={isLoading}>
          Save Meal
        </Button>
        <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  )


  // Shows all meals
  const rightColumnEdit = (
    <div className="space-y-4 min-h-[65vh]">
      <h3 className="text-lg font-semibold">Your Meals</h3>
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          // Show loading skeletons
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <MealSkeleton key={index} />
            ))}
          </div>
        ) : mealCombos.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No meals added yet
          </p>
        ) : (
          <>
            {/* Search Bar - Sticky */}
            <div className="sticky top-0 z-10 bg-background pb-2">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>

            {/* Meal List */}
            <div className="space-y-2">
              {filteredMealCombos.map((meal) => (
                <Card key={meal.id}>
                  {/* Meal card */}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{meal.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {meal.ingredients.map(i => `${i.name} (${i.quantity})`).join(', ')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(meal)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(meal.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Shows selected meal ingredients
  const rightColumnAdd = (
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
        <NutritionalSummaryCard totals={calculateTotals()} />
      )}
    </div>
  )

  return (
    <DataManagementModal
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        setTimeout(() => resetForm(), 500)
      }}
      title="Manage Meals"
      description="Add, edit, or remove meals from your database."
      leftColumn={isAdding ? leftColumnAdd : (editingId ? leftColumnEdit : leftColumnNeutral)}
      rightColumn={isAdding ? rightColumnAdd : rightColumnEdit}
    />
  );
}

export default MealManagementModal; 