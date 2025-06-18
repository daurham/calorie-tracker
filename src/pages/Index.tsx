import { useState, useEffect } from "react";
import { Plus, Target, TrendingUp, Calendar, Settings, Eye, EyeOff, ChevronDown, Pencil, Trash2, ChefHat, MoreVertical, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MealComboDialog from "@/components/MealComboDialog";
import MealLogDialog from "@/components/MealLogDialog";
import TodaysMeals from "@/components/TodaysMeals";
import SettingsMenu from "@/components/SettingsMenu";
import { addIngredientData, addMealComboData, deleteIngredientData, deleteMealComboData, getIngredientsData, getMealCombosData, updateIngredientData, updateMealComboData } from "@/lib/data-source";
import { caloricGoal, carbsGoal, fatGoal, proteinGoal, testMode } from "@/settings.config";
import { deleteMealCombo } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import IngredientManagementDialog from "@/components/IngredientManagementDialog";
import { MealComboManagementDialog } from '@/components/MealComboManagementDialog';
import ThemeToggle from "@/components/ThemeToggle";
import { formatMacros, formatMacroProgress } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MealCombo, MealComboInput } from '@/lib/api-client';
import { Input } from "@/components/ui/input";

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
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [showMacros, setShowMacros] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [mealCombos, setMealCombos] = useState([]);
  
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [allIngredients, setAllIngredients] = useState([]);
  const [mealCombos, setMealCombos] = useState([]);

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
      console.log("ingredients", ingredients);
      console.log("combos", combos);
      const sortedIngredients = ingredients.sort((a, b) => a.name.localeCompare(b.name));
      const sortedCombos = combos.sort((a, b) => a.name.localeCompare(b.name));
      setMealCombos(sortedCombos);
      setAllIngredients(sortedIngredients);
      // You might want to store ingredients in state if needed
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    const savedTodaysMeals = localStorage.getItem(STORAGE_KEYS.TODAYS_MEALS);
    if (savedTodaysMeals) {
      const meals = JSON.parse(savedTodaysMeals);
      setTodaysMeals(meals);
      // meals.forEach((meal) =>{
      //   console.log("meal", meal);
      // })
      // Recalculate daily calories and macros
      const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      const totalMacros = meals.reduce((acc, meal) => ({
        protein: Number(acc.protein) + Number(meal.protein),
        carbs: Number(acc.carbs) + Number(meal.carbs),
        fat: Number(acc.fat) + Number(meal.fat)
      }), { protein: 0, carbs: 0, fat: 0 });
      setDailyCalories(totalCalories);
      setDailyMacros(totalMacros);
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

  // console.log("dailyMacros", dailyMacros);

  const addMealToToday = (meal) => {
    const mealWithId = { ...meal, id: Date.now(), timestamp: new Date().toLocaleTimeString() };
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
      console.log("removing all meals")
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
    const meal = todaysMeals.find(m => m.id === mealId);
    if (meal) {
      setTodaysMeals(prev => prev.filter(m => m.id !== mealId));
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
    setAllIngredients(prev => [...prev, newIngredientResult].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateIngredient = async (ingredient) => {
    // console.log("updating ingredient", ingredient);
    const updatedIngredientResult = await updateIngredientData(ingredient);
    setAllIngredients(prev => prev.map(i => i.id === ingredient.id ? updatedIngredientResult : i).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const deleteIngredient = async (ingredientId) => {
    // console.log("deleting ingredient", ingredientId);
    const deletedIngredientResult = await deleteIngredientData(ingredientId);
    setAllIngredients(prev => prev.filter(ingredient => ingredient.id !== ingredientId).sort((a, b) => a.name.localeCompare(b.name)));
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
      setMealCombos(prev => [...prev, newMealCombo].sort((a, b) => a.name.localeCompare(b.name)));
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
      const updatedMealCombo = await response.json();
      setMealCombos(prev => prev.map(mc => mc.id === id ? updatedMealCombo : mc));
    } catch (error) {
      console.error('Error updating meal combo:', error);
      throw error;
    }
  };

  const handleDeleteMealCombo = async (id: number) => {
    try {
      const response = await fetch(`/api/meal-combos?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete meal combo');
      setMealCombos(prev => prev.filter(mc => mc.id !== id));
    } catch (error) {
      console.error('Error deleting meal combo:', error);
      throw error;
    }
  };

  const openMealEditManagement = (id: number) => {
    setEditingId(id);
    setIsMealComboManagementOpen(true);
  };  

  const filteredMealCombos = mealCombos.filter(combo => 
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    combo.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBackup = () => {
    const backupData = {
      ingredients: allIngredients,
      mealCombos: mealCombos,
      dailyMeals: todaysMeals,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calorie-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              {/* Backup Button */}
              {testMode && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleBackup}
              >
                <Download className="h-4 w-4" />
                Backup Data
              </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Daily Progress Section */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 mb-6 sm:mb-8">
          <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Today's Progress
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMacros(!showMacros)}
                  className="text-white hover:bg-white/20 px-2"
                >
                  {showMacros ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Calorie Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Calories consumed</span>
                  <span className="font-bold text-sm sm:text-base">{dailyCalories} / {dailyGoal}</span>
                </div>
                <Progress value={progressPercentage} className="h-2 sm:h-3 bg-white/20" />
                
                {/* Macro Progress */}
                {showMacros && (
                  <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-white/20">
                    <div className="text-sm opacity-90 mb-2">Macros</div>
                    
                    {/* Protein */}
                    {visibleMacros.protein && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span>Protein</span>
                          <span>{formatMacros(dailyMacros.protein, macroGoals.protein).protein}</span>
                        </div>
                        <Progress value={macroProgress.protein} className="h-1.5 sm:h-2 bg-white/20" />
                      </div>
                    )}
                    
                    {/* Carbs */}
                    {visibleMacros.carbs && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span>Carbs</span>
                          <span>{formatMacros(dailyMacros.carbs, macroGoals.carbs).carbs}</span>
                        </div>
                        <Progress value={macroProgress.carbs} className="h-1.5 sm:h-2 bg-white/20" />
                      </div>
                    )}
                    
                    {/* Fat */}
                    {visibleMacros.fat && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span>Fat</span>
                          <span>{formatMacros(dailyMacros.fat, macroGoals.fat).fat}</span>
                        </div>
                        <Progress value={macroProgress.fat} className="h-1.5 sm:h-2 bg-white/20" />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{Math.max(0, dailyGoal - dailyCalories)}</div>
                    <div className="text-xs sm:text-sm opacity-90">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{todaysMeals.length}</div>
                    <div className="text-xs sm:text-sm opacity-90">Meals logged</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Avg. per meal</span>
                  <span className="font-semibold text-sm sm:text-base">
                    {todaysMeals.length > 0 ? Math.round(dailyCalories / todaysMeals.length) : 0} cal
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Progress</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                {showMacros && (
                  <>
                    {visibleMacros.protein && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Protein</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                          {formatMacroProgress(macroProgress.protein)}
                        </span>
                      </div>
                    )}
                    {visibleMacros.carbs && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Carbs</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm sm:text-base">
                          {formatMacroProgress(macroProgress.carbs)}
                        </span>
                      </div>
                    )}
                    {visibleMacros.fat && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Fat</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400 text-sm sm:text-base">
                          {formatMacroProgress(macroProgress.fat)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Goal status</span>
                  <span className={`text-xs sm:text-sm font-semibold ${
                    progressPercentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 
                    progressPercentage >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {progressPercentage >= 100 ? 'Complete!' : 
                     progressPercentage >= 75 ? 'Almost there' : 'On track'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
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
        availableIngredients={allIngredients}
      />
      <MealLogDialog 
        open={isLogDialogOpen} 
        onOpenChange={setIsLogDialogOpen}
        onAddMeal={addMealToToday}
        mealCombos={mealCombos}
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
        ingredients={allIngredients}
        onAddIngredient={addIngredient}
        onUpdateIngredient={updateIngredient}
        onDeleteIngredient={deleteIngredient}
      />
      <MealComboManagementDialog
        open={isMealComboManagementOpen}
        onOpenChange={setIsMealComboManagementOpen}
        mealCombos={mealCombos}
        availableIngredients={allIngredients}
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
