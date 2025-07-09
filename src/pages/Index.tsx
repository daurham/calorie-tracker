import { useState, useEffect } from "react";
import { 
  Plus, 
  TrendingUp, 
  Settings, 
  Pencil, 
  Trash2, 
  ChefHat, 
  MoreVertical, 
  Search, 
  Download,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button, 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { 
  MealComboDialog, 
  MealLogDialog, 
  TodaysMeals, 
  TodaysProgress,
  QuickStats, 
  SettingsMenu, 
  IngredientManagementDialog, 
  MealComboManagementDialog, 
  ThemeToggle,
} from "@/components";
import { 
  addIngredientData, 
  deleteIngredientData, 
  getIngredientsData,
  getMealCombosData, 
  updateIngredientData,
} from "@/lib/data-source";
import { useNavigate } from "react-router-dom";
import { MealCombo, MealComboInput } from '@/lib/api-client';
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
  testMode,
} from "@/settings.config";

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
  const navigate = useNavigate();
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [showMacros, setShowMacros] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [mealCombos, setMealCombosData] = useState([]);
  
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
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

  const [isMealComboManagementOpen, setIsMealComboManagementOpen] = useState(false);

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

  const ingredientInUse = (ingredientId) => {
    return mealCombosData.some(mealCombo => mealCombo.ingredients.some(i => i.id === ingredientId));
  }

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
    setIsMealComboManagementOpen(true);
  };  

  const filteredMealCombos = mealCombosData.filter(combo => 
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    combo.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Caloric Tracker
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Smart calorie tracking made simple</p>
            </div>
            {/* Navbar Buttons */}
            <div className="flex gap-1 sm:gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              {/* Settings Button */}
              <Button 
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {/* Ingredients Button */}
              <Button 
                onClick={() => setIsIngredientsDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3"
              >
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Ingredients</span>
              </Button>
              {/* Meal Combos Button */}
              <Button 
                onClick={() => setIsComboDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-2 sm:px-3"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Create Combo</span>
              </Button>
              {/* Log Meal Button */}
              <Button 
                onClick={() => setIsLogDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Log Meal</span>
              </Button>
              {/* AI Meal Plan Generator Button */}
              <Button
                onClick={() => navigate('/meal-plan-generator')}
                variant="outline"
                size="sm"
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950 px-2 sm:px-3"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">AI Meal Plan</span>
              </Button>
              {/* Backup Button */}
              {testMode && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fetch("/api/get-data", {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                })}
              >
                <Download className="h-4 w-4" />
                Fetch Data
              </Button>
              )}
            </div>
          </div>
        </div>
      </header>
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
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                Available Meal Combos
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meals or ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/50 dark:bg-slate-700/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMealCombos.map((combo) => (
                <Card key={combo.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <h3 className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm sm:text-base line-clamp-2">
                        {combo.name}
                      </h3>
                      <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 ml-2 flex-shrink-0">
                        {combo.calories}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                      {combo.ingredients.map(i => i.quantity > 1 ? `${i.name} (${i.quantity})` : i.name).join(", ")}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        P: {combo.protein}g | C: {combo.carbs}g | F: {combo.fat}g
                      </div>
                      <div className="flex gap-1 w-full sm:w-auto">
                        <Button 
                          size="sm" 
                          onClick={() => addMealToToday(combo)}
                          className="bg-emerald-500 hover:bg-emerald-600 flex-1 sm:flex-none"
                        >
                          Add
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="px-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              openMealEditManagement(combo.id);
                              // We'll handle the edit in the management dialog
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMealCombo(combo.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <MealComboDialog 
        open={isComboDialogOpen} 
        onOpenChange={setIsComboDialogOpen}
        onAddMealCombo={handleAddMealCombo}
        availableIngredients={allIngredientsData}
      />
      <MealLogDialog 
        open={isLogDialogOpen} 
        onOpenChange={setIsLogDialogOpen}
        onAddMeal={addMealToToday}
        mealCombos={mealCombosData}
      />
      <SettingsMenu
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        macroGoals={macroGoals}
        onMacroGoalsChange={setMacroGoals}
        visibleMacros={visibleMacros}
        onVisibleMacrosChange={setVisibleMacros}
        dailyGoal={dailyGoal}
        onDailyGoalChange={setDailyGoal}
      />
      <IngredientManagementDialog
        open={isIngredientsDialogOpen}
        onOpenChange={setIsIngredientsDialogOpen}
        ingredients={allIngredientsData}
        onAddIngredient={addIngredient}
        onUpdateIngredient={updateIngredient}
        onDeleteIngredient={deleteIngredient}
      />
      <MealComboManagementDialog
        open={isMealComboManagementOpen}
        onOpenChange={setIsMealComboManagementOpen}
        mealCombos={mealCombosData}
        availableIngredients={allIngredientsData}
        onAddMealCombo={handleAddMealCombo}
        onUpdateMealCombo={handleUpdateMealCombo}
        onDeleteMealCombo={handleDeleteMealCombo}
        macroGoals={macroGoals}
        mealId={editingId}
      />
    </div>
  );
};
   

export default Index;
