import { useState, useEffect } from "react";
import { 
  TodaysMeals, 
  TodaysProgress,
  QuickStats, 
  AvailableMeals,
  Navbar,
} from "@/components";
import { 
  MealComboModal,
  MealLogModal,
  IngredientManagementModal,
  MealManagementModal,
  SettingsMenuModal,
} from "@/components/modals";
import { 
  addIngredientData, 
  deleteIngredientData, 
  getIngredientsData,
  getMealCombosData, 
  updateIngredientData,
} from "@/lib/data-source";
import { 
  formatMacroProgress, 
  mapComboMealsWithIngredients,
  generateUniqueId
} from "@/lib/utils";
import { 
  caloricGoal, 
  carbsGoal, 
  fatGoal, 
  proteinGoal, 
} from "@/settings.config";
import { MealCombo, MealComboInput } from '@/types';

// Local storage keys
const STORAGE_KEYS = {
  DAILY_GOAL: 'nutritrack_daily_goal',
  MACRO_GOALS: 'nutritrack_macro_goals',
  TODAYS_MEALS: 'nutritrack_todays_meals',
  VISIBLE_MACROS: 'nutritrack_visible_macros',
  SHOW_MACROS: 'nutritrack_show_macros',
  QUICK_STATS_OPEN: 'nutritrack_quick_stats_open',
  TODAYS_MEALS_OPEN: 'nutritrack_todays_meals_open',
  MEAL_COMBOS_OPEN: 'nutritrack_meal_combos_open'
};

const Index = () => {
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [showMacros, setShowMacros] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isIngredientsManagementOpen, setIsIngredientsManagementOpen] = useState(false);
  const [isMealManagementOpen, setIsMealManagementOpen] = useState(false);

  const [allIngredientsData, setAllIngredientsData] = useState([]);
  const [mealCombosData, setMealCombosData] = useState([]);

  // Collapsible states
  const [isQuickStatsOpen, setIsQuickStatsOpen] = useState(true);
  const [isTodaysMealsOpen, setIsTodaysMealsOpen] = useState(true);
  const [isMealCombosOpen, setIsMealCombosOpen] = useState(true);  
  // Configurable goals
  const [dailyGoal, setDailyGoal] = useState(caloricGoal);
  const [macroGoals, setMacroGoals] = useState({
    protein: proteinGoal, // grams
    carbs: carbsGoal,   // grams
    fat: fatGoal       // grams
  });
  
  const [visibleMacros, setVisibleMacros] = useState({
    protein: true,
    carbs: true,
    fat: true
  });


  const [searchQuery, setSearchQuery] = useState("");

  // Load data from database or sample data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ingredients, combos] = await Promise.all([
        getIngredientsData(),
        getMealCombosData()
      ]);
      const mappedCombos = mapComboMealsWithIngredients(combos, ingredients);
      const sortedIngredients = ingredients.sort((a, b) => a.name.localeCompare(b.name));
      const sortedCombos = mappedCombos.sort((a, b) => a.name.localeCompare(b.name));
      setMealCombosData(sortedCombos);
      setAllIngredientsData(sortedIngredients);
      loadLocalMealData(sortedCombos);
      // You might want to store ingredients in state if needed
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalMealData = (mealCombosData: MealCombo[]) => {
    // Load today's meals
    const savedTodaysMeals = localStorage.getItem(STORAGE_KEYS.TODAYS_MEALS);
    if (savedTodaysMeals) {
      const oldSavedMeals = JSON.parse(savedTodaysMeals);
      // Map the old comboId to the combo data, in case of updates 
      const updatedMeals = oldSavedMeals.map(oldMeal => {
        const updatedMeal = mealCombosData.find(combo => combo.id === oldMeal.id);
        if (updatedMeal) {
          return {
            ...updatedMeal,
            timestamp: oldMeal?.timestamp || ""
          }
        }
        return oldMeal;
      });
      setTodaysMeals(updatedMeals);

      // Recalculate daily calories and macros
      const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
      const totalMacros = updatedMeals.reduce((acc, meal) => ({
        protein: Number(acc.protein) + Number(meal.protein),
        carbs: Number(acc.carbs) + Number(meal.carbs),
        fat: Number(acc.fat) + Number(meal.fat)
      }), { protein: 0, carbs: 0, fat: 0 });
      setDailyCalories(totalCalories);
      setDailyMacros(totalMacros);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    // Load daily goal
    const savedDailyGoal = localStorage.getItem(STORAGE_KEYS.DAILY_GOAL);
    if (savedDailyGoal) {
      setDailyGoal(Number(savedDailyGoal));
    }

    // Load macro goals
    const savedMacroGoals = localStorage.getItem(STORAGE_KEYS.MACRO_GOALS);
    if (savedMacroGoals) {
      setMacroGoals(JSON.parse(savedMacroGoals));
    }

    // Load today's meals
    loadLocalMealData([]);

    // Load visible macros
    const savedVisibleMacros = localStorage.getItem(STORAGE_KEYS.VISIBLE_MACROS);
    if (savedVisibleMacros) {
      setVisibleMacros(JSON.parse(savedVisibleMacros));
    }

    // Load show macros state
    const savedShowMacros = localStorage.getItem(STORAGE_KEYS.SHOW_MACROS);
    if (savedShowMacros !== null) {
      setShowMacros(JSON.parse(savedShowMacros));
    }

    // Load collapsible states
    const savedQuickStatsOpen = localStorage.getItem(STORAGE_KEYS.QUICK_STATS_OPEN);
    if (savedQuickStatsOpen !== null) {
      setIsQuickStatsOpen(JSON.parse(savedQuickStatsOpen));
    }

    const savedTodaysMealsOpen = localStorage.getItem(STORAGE_KEYS.TODAYS_MEALS_OPEN);
    if (savedTodaysMealsOpen !== null) {
      setIsTodaysMealsOpen(JSON.parse(savedTodaysMealsOpen));
    }

    const savedMealCombosOpen = localStorage.getItem(STORAGE_KEYS.MEAL_COMBOS_OPEN);
    if (savedMealCombosOpen !== null) {
      setIsMealCombosOpen(JSON.parse(savedMealCombosOpen));
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_GOAL, dailyGoal.toString());
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MACRO_GOALS, JSON.stringify(macroGoals));
  }, [macroGoals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TODAYS_MEALS, JSON.stringify(todaysMeals));
  }, [todaysMeals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VISIBLE_MACROS, JSON.stringify(visibleMacros));
  }, [visibleMacros]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_MACROS, JSON.stringify(showMacros));
  }, [showMacros]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUICK_STATS_OPEN, JSON.stringify(isQuickStatsOpen));
  }, [isQuickStatsOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TODAYS_MEALS_OPEN, JSON.stringify(isTodaysMealsOpen));
  }, [isTodaysMealsOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEAL_COMBOS_OPEN, JSON.stringify(isMealCombosOpen));
  }, [isMealCombosOpen]);
  
  const progressPercentage = Math.min((dailyCalories / dailyGoal) * 100, 100);
  const macroProgress = {
    protein: Math.min((dailyMacros.protein / macroGoals.protein) * 100, 100),
    carbs: Math.min((dailyMacros.carbs / macroGoals.carbs) * 100, 100),
    fat: Math.min((dailyMacros.fat / macroGoals.fat) * 100, 100)
  };

  const addMealToToday = (meal) => {
    const mealWithId = { 
      ...meal, 
      id: meal.id, 
      uniqueMealId: generateUniqueId(), 
      timestamp: new Date().toLocaleTimeString()
    };
    setTodaysMeals(prev => [...prev, mealWithId]);
    setDailyCalories(prev => prev + meal.calories);
    setDailyMacros(prev => ({
      protein: Number(prev.protein) + Number(meal.protein),
      carbs: Number(prev.carbs) + Number(meal.carbs),
      fat: Number(prev.fat) + Number(meal.fat)
    }));
  };

  const removeMealFromToday = (mealId) => {
    if (mealId === "all") {
      // console.log("removing all meals")
      todaysMeals.length = 0;
      setTodaysMeals([]);
      setDailyCalories(0);
      setDailyMacros({
        protein: 0,
        carbs: 0,
        fat: 0,
      })
      return;
    }
    const meal = todaysMeals.find(m => m.uniqueMealId === mealId);
    if (meal) {
      setTodaysMeals(prev => prev.filter(m => m.uniqueMealId !== mealId));
      setDailyCalories(prev => prev - meal.calories);
      setDailyMacros(prev => ({
        protein: Number(prev.protein) - Number(meal.protein),
        carbs: Number(prev.carbs) - Number(meal.carbs),
        fat: Number(prev.fat) - Number(meal.fat)
      }));
    }
  };

  const addIngredient = async (ingredient) => {
    // console.log("adding ingredient", ingredient);
    const newIngredientResult = await addIngredientData(ingredient);
    setAllIngredientsData(prev => [...prev, newIngredientResult].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateIngredient = async (ingredient) => {
    // console.log("updating ingredient", ingredient);
    const updatedIngredientResult = await updateIngredientData(ingredient);
    loadData();
    // setAllIngredientsData(prev => prev.map(i => i.id === ingredient.id ? updatedIngredientResult : i).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const deleteIngredient = async (ingredientId) => {
    // console.log("deleting ingredient", ingredientId);
    const deletedIngredientResult = await deleteIngredientData(ingredientId);
    setAllIngredientsData(prev => prev.filter(ingredient => ingredient.id !== ingredientId).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleAddMealCombo = async (mealCombo: MealComboInput) => {
    try {
      const response = await fetch('/api/meal-combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealCombo),
      });
      if (!response.ok) throw new Error('Failed to add meal combo');
      const newMealCombo = await response.json();
      setMealCombosData(prev => [...prev, newMealCombo].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error adding meal combo:', error);
      throw error;
    }
  };

  const handleUpdateMealCombo = async (id: number, mealCombo: MealComboInput) => {
    try {
      const response = await fetch(`/api/meal-combos?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealCombo),
      });
      if (!response.ok) throw new Error('Failed to update meal combo');
      loadData();
    } catch (error) {
      console.error('Error updating meal combo:', error);
      throw error;
    }
  };

  const handleDeleteMealCombo = async (id: number) => {
    try {
      setMealCombosData(prev => prev.filter(mc => mc.id !== id));
      const response = await fetch(`/api/meal-combos?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete meal combo');
    } catch (error) {
      console.error('Error deleting meal combo:', error);
      throw error;
    }
  };

  const openMealEditManagement = (id: number) => {
    setEditingId(id);
    setIsMealManagementOpen(true);
  };  

  const filteredMealCombos = mealCombosData.filter(combo => 
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    combo.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <Navbar
        setIsSettingsOpen={setIsSettingsOpen}
        setIsIngredientsModalOpen={setIsIngredientsManagementOpen}
        setIsComboModalOpen={setIsComboModalOpen}
        setIsMealsModalOpen={setIsMealManagementOpen}
        setIsLogModalOpen={setIsLogModalOpen}
      />

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Daily Progress Section */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 mb-6 sm:mb-8">
          <TodaysProgress
            dailyCalories={dailyCalories}
            dailyGoal={dailyGoal}
            dailyMacros={dailyMacros}
            macroGoals={macroGoals}
            visibleMacros={visibleMacros}
            showMacros={showMacros}
            setShowMacros={setShowMacros}
            todaysMeals={todaysMeals}
          />

        {/* Quick Stats */}
          <QuickStats
            todaysMeals={todaysMeals}
            dailyCalories={dailyCalories}
            progressPercentage={progressPercentage}
            showMacros={showMacros}
            visibleMacros={visibleMacros}
            macroProgress={macroProgress}
            formatMacroProgress={formatMacroProgress}
          />
        </div>

        {/* Today's Meals */}
        <TodaysMeals 
          meals={todaysMeals} 
          onRemoveMeal={removeMealFromToday}
        />

        {/* Available Meal Combos */}
        <AvailableMeals 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          addMealToToday={addMealToToday}
          openMealEditManagement={openMealEditManagement}
          handleDeleteMealCombo={handleDeleteMealCombo}
          filteredMealCombos={filteredMealCombos}
        />
      </main>

      {/* Modals */}
      <MealComboModal 
        open={isComboModalOpen} 
        onOpenChange={setIsComboModalOpen}
        onAddMealCombo={handleAddMealCombo}
        availableIngredients={allIngredientsData}
      />
      <MealLogModal 
        open={isLogModalOpen} 
        onOpenChange={setIsLogModalOpen}
        onAddMeal={addMealToToday}
        mealCombos={mealCombosData}
      />
      <SettingsMenuModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        macroGoals={macroGoals}
        onMacroGoalsChange={setMacroGoals}
        visibleMacros={visibleMacros}
        onVisibleMacrosChange={setVisibleMacros}
        dailyGoal={dailyGoal}
        onDailyGoalChange={setDailyGoal}
      />
      <IngredientManagementModal
        open={isIngredientsManagementOpen}
        onOpenChange={setIsIngredientsManagementOpen}
        ingredients={allIngredientsData}
        onAddIngredient={addIngredient}
        onUpdateIngredient={updateIngredient}
        onDeleteIngredient={deleteIngredient}
        isLoading={isLoading}
      />
      <MealManagementModal
        open={isMealManagementOpen}
        onOpenChange={setIsMealManagementOpen}
        mealCombos={mealCombosData}
        availableIngredients={allIngredientsData}
        onAddMealCombo={handleAddMealCombo}
        onUpdateMealCombo={handleUpdateMealCombo}
        onDeleteMealCombo={handleDeleteMealCombo}
        macroGoals={macroGoals}
        mealId={editingId}
        isLoading={isLoading}
      />
    </div>
  );
};
   

export default Index;
