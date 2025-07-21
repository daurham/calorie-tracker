import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks";
import { DataManagementModal, AlertModal } from "@/components/modals";
import { Ingredient, Meal, MealInput, MealType } from '@/types';
import { capitalizeMealName } from '@/lib/utils';
import RightColumnAdd from "./RightColumnAdd";
import RightColumnEdit from "./RightColumnEdit";
import LeftColumnAdd from "./LeftColumnAdd";
import LeftColumnEdit from "./LeftColumnEdit";
import LeftColumnNeutral from "./LeftColumnNeutral";
import { MealManagementProvider } from "./MealManagementContext";
import { delay } from "@/lib/utils";

interface MealManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: Meal[];
  availableIngredients: Ingredient[];
  onAddMealCombo: (meal: MealInput) => Promise<void>;
  onUpdateMealCombo: (id: number, meal: MealInput) => Promise<void>;
  onDeleteMealCombo: (id: number) => Promise<void>;
  mealId: number | null;
  isLoading?: boolean;
}

const MealManagementModal = ({
  open,
  onOpenChange,
  meals,
  availableIngredients,
  onAddMealCombo,
  onUpdateMealCombo,
  onDeleteMealCombo,
  mealId,
  isLoading = false
}: MealManagementModalProps) => {
  const { toast } = useToast();
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [editingId, setEditingId] = useState<number | null>(mealId || null);
  const [formData, setFormData] = useState<{
    name: string;
    meal_type: MealType;
    ingredients: Ingredient[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes: string;
    instructions: string;
  }>({
    name: '',
    meal_type: 'composed',
    ingredients: [],
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    notes: '',
    instructions: '',
  });
  const [notesCollapsed, setNotesCollapsed] = useState(() => !formData.notes);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(() => !formData.instructions);

  const [mode, setMode] = useState<'add' | 'edit' | 'none'>('none');
  const [mealType, setMealType] = useState<MealType>('composed');

  const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>([]);
  const [originalStandaloneMacros, setOriginalStandaloneMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteMealId, setDeleteMealId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Calculate totals (memoized function)
  const calculateTotals = useMemo(() => {
    return (ingredients: { id: number; name: string; quantity: number }[]) => {
      return ingredients.reduce((totals, ingredient) => {
        // Find the full ingredient data from availableIngredients
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
  }, [availableIngredients]);

  // Memoized filtered data
  const filteredMeals = useMemo(() =>
    meals.filter(meal =>
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.ingredients.some(i => i.name?.toLowerCase()?.includes(searchQuery.toLowerCase()))
    ), [meals, searchQuery]
  );

  const filteredIngredients = useMemo(() =>
    availableIngredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [availableIngredients, searchQuery]
  );

  // Memoized totals
  const addModeTotals = useMemo(
    () => calculateTotals(selectedIngredients),
    [calculateTotals, selectedIngredients]
  );
  const editModeTotals = useMemo(() => {
    // For standalone meals, use the formData values directly
    if (formData.meal_type === 'standalone') {
      // const meal = meals.find(meal => meal.id === editingId);
      // console.log(meal);
      return {
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fat,
      };
    }

    // For composed meals, calculate from ingredients
    return calculateTotals(formData.ingredients);
  }, [calculateTotals, formData.ingredients, formData.meal_type, formData.calories, formData.protein, formData.carbs, formData.fat]);


  // Initialize modal when it opens
  useEffect(() => {
    if (open) {
      initializeModal();
    }
  }, [open, mealId, meals]);


  // Reset selectedIngredients when mealType changes
  useEffect(() => {
    setSelectedIngredients([]);
    // console.log("formData mealType change", formData);
  }, [mealType]);

  // Initializer function that runs when modal opens
  const initializeModal = () => {
    if (mealId !== null) {
      setMode('edit');
      setEditingId(mealId);
      const meal = meals.find(meal => meal.id === mealId);
      if (meal) {
        setFormData({
          name: meal.name,
          meal_type: meal.meal_type,
          ingredients: meal.ingredients,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          notes: meal.notes || '',
          instructions: meal.instructions || '',
        });
      }
    } else {
      setMode('none');
      setEditingId(null);
    }
  };

  const handleAddIngredient = () => {
    const firstIngredient = availableIngredients[0];
    if (firstIngredient) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { ...firstIngredient, quantity: 1 }],
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
            return ingredient ? { ...ing, ...ingredient } : ing;
          }
          return { ...ing, [field]: value };
        }
        return ing;
      }),
    }));
  };


  // Remove ghost ingredient from meal data
  const trimGhostData = (meal: Meal) => {
    return {
      ...meal,
      ingredients: meal.ingredients.filter(i => i.id !== null),
    };
  };

  const hasGhostIngredient = (meal: Meal) => {
    const ghostIngredient = meal.ingredients.find(i => i.id === null) && meal.ingredients.length === 1;
    return ghostIngredient ? true : false;
  };

  const consolidateIngredients = (ingredients: { id: number; name: string; quantity: number }[]) => {
    const consolidated = ingredients.reduce((acc, ingredient) => {
      const existing = acc.find(item => item.id === ingredient.id);
      if (existing) {
        existing.quantity += ingredient.quantity;
      } else {
        acc.push({ ...ingredient });
      }
      return acc;
    }, [] as { id: number; name: string; quantity: number }[]);

    return consolidated;
  };

  // Unified submit handler for both add and edit operations
  const handleSubmit = async (e?: React.FormEvent, addAsNew: boolean = false) => {
    if (e) e.preventDefault();

    const isAdding = mode === 'add' || (mode === 'edit' && addAsNew);
    const isEditing = mode === 'edit' && !addAsNew;

    // console.log("#### Running handleSubmit ####");
    // console.log('MODE: ', mode);
    // console.log('IS ADDING: ', isAdding);
    // console.log('IS EDITING: ', isEditing);

    // Validate meal name
    if (!formData.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please add a meal name.",
        variant: "destructive",
      });
      return;
    }

    // Validate for add operations - check if meal already exists
    if (isAdding && meals.find(meal => meal.name === formData.name)) {
      toast({
        title: `${formData.name} already exists`,
        description: "Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    // Validate composed meals
    if (formData.meal_type === 'composed') {
      const ingredients = isAdding ? selectedIngredients : formData.ingredients;
      if (ingredients.length === 0 || hasGhostIngredient({ ingredients } as Meal)) {
        toast({
          title: "Missing information",
          description: "Please add at least one ingredient for composed meals.",
          variant: "destructive",
        });
        return;
      }
      // Validate that all ingredients have valid quantities
      const invalidIngredients = ingredients.filter(ing => ing.quantity === undefined || ing.quantity === null || ing.quantity === '' || isNaN(Number(ing.quantity)) || Number(ing.quantity) <= 0);
      if (invalidIngredients.length > 0) {
        toast({
          title: "Invalid ingredient quantity",
          description: "Please enter a valid quantity for all ingredients (must be greater than 0).",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate standalone meals
    if (formData.meal_type === 'standalone' &&
      (formData.calories === 0 && formData.protein === 0 &&
        formData.carbs === 0 && formData.fat === 0)) {
      toast({
        title: "Missing information",
        description: "Please add nutritional information for standalone meals.",
        variant: "destructive",
      });
      return;
    }

    const allIngredientsMatch = (mealData: Meal) => formData.ingredients.every((ing, index) => {
      return (
        ing.id === mealData.ingredients[index].id &&
        ing.quantity === mealData.ingredients[index].quantity &&
        ing.name === mealData.ingredients[index].name &&
        ing.calories === mealData.ingredients[index].calories &&
        ing.protein === mealData.ingredients[index].protein &&
        ing.carbs === mealData.ingredients[index].carbs &&
        ing.fat === mealData.ingredients[index].fat
      );
    });

    // Check if nothing changed when updating existing meal
    if (isEditing) {
      const mealData = meals.find(meal => meal.id === editingId);
      if (mealData) {
        const trimmedMealData = trimGhostData(mealData);
        if (
          trimmedMealData.name === formData.name &&
          trimmedMealData.ingredients.length === formData.ingredients.length &&
          trimmedMealData.ingredients.every((ing, index) => ing.id === formData.ingredients[index].id) &&
          allIngredientsMatch(trimmedMealData) &&
          trimmedMealData.notes === formData.notes &&
          trimmedMealData.instructions === formData.instructions &&
          trimmedMealData.calories == formData.calories &&
          trimmedMealData.protein == formData.protein &&
          trimmedMealData.carbs == formData.carbs &&
          trimmedMealData.fat == formData.fat &&
          trimmedMealData.meal_type == formData.meal_type
        ) {
          toast({
            title: "Nothing changed",
            description: "Please change something to update the meal.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    try {
      // Prepare ingredients based on mode and meal type
      let finalIngredients: { id: number; name: string; quantity: number }[] = [];

      if (formData.meal_type === 'composed') {
        const sourceIngredients = isAdding ? selectedIngredients : formData.ingredients;
        finalIngredients = consolidateIngredients(sourceIngredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity
        })));
      }

      // Calculate totals for composed meals
      const calculatedTotals = formData.meal_type === 'composed'
        ? calculateTotals(isAdding ? selectedIngredients : formData.ingredients)
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      const newMealData: MealInput = {
        name: capitalizeMealName(formData.name),
        meal_type: formData.meal_type,
        ingredients: finalIngredients.map(({ id, quantity }) => ({ id, quantity })),
        notes: formData.notes,
        instructions: formData.instructions,
        calories: formData.meal_type === 'standalone' ? formData.calories : calculatedTotals.calories,
        protein: formData.meal_type === 'standalone' ? formData.protein : calculatedTotals.protein,
        carbs: formData.meal_type === 'standalone' ? formData.carbs : calculatedTotals.carbs,
        fat: formData.meal_type === 'standalone' ? formData.fat : calculatedTotals.fat,
      };

      if (isAdding) {
        // console.log("adding meal", newMealData);
        await onAddMealCombo(newMealData);
        toast({
          title: 'Success',
          description: 'Meal added successfully',
          variant: 'default',
        });
      } else {
        // console.log("updating meal", newMealData);
        await onUpdateMealCombo(editingId!, newMealData);
        toast({
          title: 'Success',
          description: 'Meal updated successfully',
          variant: 'default',
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

  const handleEdit = (meal: Meal) => {
    setMode('edit');
    setEditingId(meal.id);
    const ingredients = meal.meal_type === 'composed' ? meal.ingredients.map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity
    })) : [];

    setFormData({
      name: meal.name,
      meal_type: meal.meal_type,
      ingredients: meal.ingredients,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: meal.notes || '',
      instructions: meal.instructions || '',
    });

    // Store original data for both meal types
    if (meal.meal_type === 'composed') {
      setOriginalIngredients(meal.ingredients);
    } else {
      // Store original standalone macros
      setOriginalStandaloneMacros({
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      });
    }

    // Set initial collapsed state based on content
    setNotesCollapsed(!meal.notes);
    setInstructionsCollapsed(!meal.instructions);
    // setIsAdding(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteMealId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMealId) return;

    try {
      await onDeleteMealCombo(deleteMealId);
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
    } finally {
      setShowDeleteDialog(false);
      setDeleteMealId(null);
    }
  };

  const resetForm = () => {
    // console.log("resetForm");
    setFormData({
      name: '',
      meal_type: 'composed',
      ingredients: [],
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: '',
      instructions: '',
    });
    setSelectedIngredients([]);
    setEditingId(null);
    setSearchQuery("");
    setMode('none');
  };

  const addIngredient = (ingredient: Ingredient) => {
    const isFound = selectedIngredients.find(i => i.id === ingredient.id);
    if (isFound) {
      updateQuantity(ingredient.id, isFound.quantity + 1);
    } else {
      setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 1 }]);
    }
  };

  const removeIngredient = (ingredientId: number) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== ingredientId));
  };

  const updateQuantity = (ingredientId: number, quantity: number) => {
    setSelectedIngredients(selectedIngredients.map(i =>
      i.id === ingredientId ? { ...i, quantity: Math.max(0.1, quantity) } : i
    ));
  };



  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const contextValue = {
    // Form state
    formData,
    setFormData,

    // Mode state
    mode,
    setMode,

    // Selected ingredients
    selectedIngredients,
    setSelectedIngredients,

    // Collapsible states
    notesCollapsed,
    setNotesCollapsed,
    instructionsCollapsed,
    setInstructionsCollapsed,

    // Search state
    searchQuery,
    setSearchQuery,

    // Original ingredients
    originalIngredients,
    setOriginalIngredients,

    // Original standalone macros
    originalStandaloneMacros,
    setOriginalStandaloneMacros,

    // Meal type
    mealType,
    setMealType,

    // Data
    meals,
    availableIngredients,
    filteredIngredients,
    filteredMeals,
    isLoading,

    // Actions
    addIngredient,
    removeIngredient,
    updateQuantity,
    handleIngredientChange,
    handleRemoveIngredient,
    handleAddIngredient,
    handleSubmit,
    handleEdit,
    handleDeleteClick,
    resetForm,
    handleDialogClose,

    // Calculations
    calculateTotals,
    addModeTotals,
    editModeTotals,
  };

  return (
    <>
      <MealManagementProvider value={contextValue}>
        <DataManagementModal
          open={open}
          onOpenChange={(val) => {
            onOpenChange(val)
            delay(resetForm)
          }}
          title="Manage Meals "
          description="Add, edit, or remove meals from your database."
          leftColumn={
            mode === 'add' ?
              <LeftColumnAdd /> : (
                mode === 'edit' ?
                  <LeftColumnEdit /> :
                  <LeftColumnNeutral />
              )
          }
          rightColumn={
            mode === 'add' ?
              <RightColumnAdd /> :
              <RightColumnEdit />
          }
        />
      </MealManagementProvider>

      <AlertModal
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteConfirm={handleDeleteConfirm}
        title="Delete Meal"
        description="Are you sure you want to delete this meal? This action cannot be undone."
      />
    </>
  );
}

export default MealManagementModal; 