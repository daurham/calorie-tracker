import { useState, useEffect } from "react";
import {
  TodaysMeals,
  TodaysProgress,
  QuickStats,
  AvailableMeals,
  Navbar,
} from "@/components";
import QuickLog from "@/components/quick-log/QuickLog";
import RecentFrequent from "@/components/quick-log/RecentFrequent";
import UndoToastHost from "@/components/quick-log/UndoToastHost";
import { candidateKey, candidateToFoodLogInput } from "@/lib/quick-log";
import type { SearchCandidate } from "@/types/food-search";
import {
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
} from "@/lib/utils";
import { useTodaysFoodLogs } from "@/hooks/useTodaysFoodLogs";
import {
  caloricGoal,
  carbsGoal,
  fatGoal,
  proteinGoal,
} from "@/settings.config";
import { MealInput } from '@/types';
import { initializeMods, modManager } from '@/lib/mods';
import { ModMeal } from '@/types/mods';
import ModModalFactory from '@/components/modals/ModModalFactory';

// Local storage keys
const STORAGE_KEYS = {
  DAILY_GOAL: 'nutritrack_daily_goal',
  MACRO_GOALS: 'nutritrack_macro_goals',
  VISIBLE_MACROS: 'nutritrack_visible_macros',
  SHOW_MACROS: 'nutritrack_show_macros',
  QUICK_STATS_OPEN: 'nutritrack_quick_stats_open',
  TODAYS_MEALS_OPEN: 'nutritrack_todays_meals_open',
  MEAL_COMBOS_OPEN: 'nutritrack_meal_combos_open'
};

const Index = () => {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    todaysMeals,
    dailyCalories,
    dailyMacros,
    addMealToToday,
    removeMealFromToday,
    updateMealInToday,
    duplicateMealInToday,
    recentFrequent,
    logFood,
    logFoods,
    undoAction,
    undoLastAction,
  } = useTodaysFoodLogs();
  const [recentAddingKey, setRecentAddingKey] = useState<string | null>(null);
  const [showMacros, setShowMacros] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isIngredientsManagementOpen, setIsIngredientsManagementOpen] = useState(false);
  const [isMealManagementOpen, setIsMealManagementOpen] = useState(false);

  // Mod system state
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [selectedMod, setSelectedMod] = useState(null);

  const [allIngredientsData, setAllIngredientsData] = useState([]);
  const [mealsData, setMealsData] = useState([]);

  // Collapsible states
  const [isQuickStatsOpen, setIsQuickStatsOpen] = useState(true);
  const [isTodaysMealsOpen, setIsTodaysMealsOpen] = useState(true);
  const [isMealCombosOpen, setIsMealCombosOpen] = useState(false);
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
  const loadData = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      const [ingredients, meals] = await Promise.all([
        getIngredientsData(),
        getMealCombosData()
      ]);
      const mappedMeals = mapComboMealsWithIngredients(meals, ingredients);
      const sortedIngredients = ingredients.sort((a, b) => a.name.localeCompare(b.name));
      const sortedMeals = mappedMeals.sort((a, b) => a.name.localeCompare(b.name));
      setMealsData(sortedMeals);
      setAllIngredientsData(sortedIngredients);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    // Initialize mods
    initializeMods();
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
    protein: macroGoals.protein > 0 && dailyMacros.protein != null
      ? Math.min((dailyMacros.protein / macroGoals.protein) * 100, 100)
      : 0,
    carbs: macroGoals.carbs > 0 && dailyMacros.carbs != null
      ? Math.min((dailyMacros.carbs / macroGoals.carbs) * 100, 100)
      : 0,
    fat: macroGoals.fat > 0 && dailyMacros.fat != null
      ? Math.min((dailyMacros.fat / macroGoals.fat) * 100, 100)
      : 0
  };

  const addIngredient = async (ingredient) => {
    // console.log("adding ingredient", ingredient);
    const newIngredientResult = await addIngredientData(ingredient);
    setAllIngredientsData(prev => [...prev, newIngredientResult].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateIngredient = async (ingredient) => {
    const updatedIngredientResult = await updateIngredientData(ingredient);
    const nextIngredients = allIngredientsData
      .map(i => i.id === ingredient.id ? { ...i, ...updatedIngredientResult } : i)
      .sort((a, b) => a.name.localeCompare(b.name));
    const nextMeals = mapComboMealsWithIngredients(mealsData, nextIngredients)
      .sort((a, b) => a.name.localeCompare(b.name));
    setAllIngredientsData(nextIngredients);
    setMealsData(nextMeals);
    await loadData({ silent: true });
  };

  const deleteIngredient = async (ingredientId) => {
    // console.log("deleting ingredient", ingredientId);
    const deletedIngredientResult = await deleteIngredientData(ingredientId);
    setAllIngredientsData(prev => prev.filter(ingredient => ingredient.id !== ingredientId).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleAddMeal = async (meal: MealInput) => {
    try {
      const response = await fetch('/api/meal-combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal),
      });
      if (!response.ok) throw new Error('Failed to add meal combo');
      const newMealCombo = await response.json();
      const mappedMeal = mapComboMealsWithIngredients([newMealCombo], allIngredientsData)[0];
      setMealsData(prev => [...prev, mappedMeal].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error adding meal combo:', error);
      throw error;
    }
  };

  const handleUpdateMealCombo = async (id: number, meal: MealInput) => {
    try {
      const response = await fetch(`/api/meal-combos?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal),
      });
      if (!response.ok) throw new Error('Failed to update meal combo');
      await loadData({ silent: true });
    } catch (error) {
      console.error('Error updating meal combo:', error);
      throw error;
    }
  };

  const handleDeleteMealCombo = async (id: number) => {
    try {
      setMealsData(prev => prev.filter(mc => mc.id !== id));
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

  // Mod system handlers
  const handleModMealClick = (mod) => {
    setSelectedMod(mod);
    setIsModModalOpen(true);
  };

  const handleModMealGenerated = (modMeal: ModMeal) => {
    // Convert ModMeal to regular Meal format for compatibility
    const regularMeal = {
      ...modMeal,
      id: parseInt(modMeal.id) || Date.now(),
      meal_type: 'standalone' as const,
      ingredients: modMeal.ingredients.map(ing => ({
        ...ing,
        id: parseInt(ing.id) || Date.now()
      })),
      // Preserve mod-specific data for display
      modData: modMeal.modData,
      weight: modMeal.weight
    };
    
    addMealToToday(regularMeal);
  };

  // Get enabled mods
  const enabledMods = modManager.getEnabledMods();
  
  // Filter regular meals
  const filteredRegularMeals = mealsData.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.ingredients.some(i => i.name?.toLowerCase()?.includes(searchQuery.toLowerCase()))
  );
  
  // Filter mod meals based on search query
  const filteredModMeals = enabledMods.filter(mod =>
    mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mod.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Combine and sort alphabetically
  const filteredMeals = [
    ...filteredRegularMeals,
    ...filteredModMeals
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <Navbar
        setIsSettingsOpen={setIsSettingsOpen}
        setIsIngredientsModalOpen={setIsIngredientsManagementOpen}
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
            isCollapsed={!isQuickStatsOpen}
            setIsCollapsed={(collapsed) => setIsQuickStatsOpen(!collapsed)}
          />
        </div>

        <UndoToastHost action={undoAction} onUndo={undoLastAction} />
        <QuickLog onLog={logFood} onLogGroup={logFoods} />

        <RecentFrequent
          items={recentFrequent}
          addingKey={recentAddingKey}
          onAdd={async (candidate: SearchCandidate) => {
            const key = candidateKey(candidate);
            setRecentAddingKey(key);
            try {
              await logFood(candidateToFoodLogInput(candidate, {
                originalInput: candidate.name,
              }));
            } finally {
              setRecentAddingKey(null);
            }
          }}
        />

        <TodaysMeals
          meals={todaysMeals}
          availableIngredients={allIngredientsData}
          onRemoveMeal={removeMealFromToday}
          onUpdateMeal={updateMealInToday}
          onDuplicateMeal={duplicateMealInToday}
          isCollapsed={!isTodaysMealsOpen}
          setIsCollapsed={(collapsed) => setIsTodaysMealsOpen(!collapsed)}
        />

        <AvailableMeals
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          addMealToToday={addMealToToday}
          openMealEditManagement={openMealEditManagement}
          handleDeleteMealCombo={handleDeleteMealCombo}
          filteredMeals={filteredMeals}
          onModMealClick={handleModMealClick}
          isLoading={isLoading}
          isCollapsed={!isMealCombosOpen}
          setIsCollapsed={(collapsed) => setIsMealCombosOpen(!collapsed)}
        />
      </main>

      {/* Modals */}
      <MealLogModal
        open={isLogModalOpen}
        onOpenChange={setIsLogModalOpen}
        onAddMeal={addMealToToday}
        meals={mealsData}
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
        onOpenChange={(open) => {
          // reset editingId when modal is closed
          setIsMealManagementOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
        meals={mealsData}
        availableIngredients={allIngredientsData}
        onAddMealCombo={handleAddMeal}
        onUpdateMealCombo={handleUpdateMealCombo}
        onDeleteMealCombo={handleDeleteMealCombo}
        mealId={editingId}
        isLoading={isLoading}
              />
        
        {/* Mod Modal */}
        {selectedMod && (
                  <ModModalFactory
          open={isModModalOpen}
          onOpenChange={setIsModModalOpen}
          mod={selectedMod}
          onMealGenerated={handleModMealGenerated}
          availableIngredients={allIngredientsData}
          availableMeals={mealsData}
          currentMacros={{
            calories: Math.round((dailyCalories) * 10) / 10,
            protein: Math.round((dailyMacros.protein ?? 0) * 10) / 10,
            carbs: Math.round((dailyMacros.carbs ?? 0) * 10) / 10,
            fat: Math.round((dailyMacros.fat ?? 0) * 10) / 10
          }}
          remainingMacros={{
            calories: Math.round((dailyGoal - dailyCalories) || 0),
            protein: Math.round(((macroGoals.protein - (dailyMacros.protein ?? 0)) || 0) * 10) / 10,
            carbs: Math.round(((macroGoals.carbs - (dailyMacros.carbs ?? 0)) || 0) * 10) / 10,
            fat: Math.round(((macroGoals.fat - (dailyMacros.fat ?? 0)) || 0) * 10) / 10
          }}
        />
        )}
      </div>
    );
};


export default Index;
