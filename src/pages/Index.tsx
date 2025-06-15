import { useState, useEffect } from "react";
import { Plus, Target, TrendingUp, Calendar, Settings, Eye, EyeOff, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MealComboDialog from "@/components/MealComboDialog";
import MealLogDialog from "@/components/MealLogDialog";
import TodaysMeals from "@/components/TodaysMeals";
import SettingsMenu from "@/components/SettingsMenu";
import IngredientManager from "@/components/IngredientManager";
import { getIngredientsData, getMealCombosData } from "@/lib/data-source";
import { caloricGoal, carbsGoal, fatGoal, proteinGoal } from "@/settings.config";
import { deleteMealCombo } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

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
  const [isLoading, setIsLoading] = useState(true);
  const [mealCombos, setMealCombos] = useState([]);
  
  // Collapsible states
  const [isQuickStatsOpen, setIsQuickStatsOpen] = useState(true);
  const [isTodaysMealsOpen, setIsTodaysMealsOpen] = useState(true);
  const [isMealCombosOpen, setIsMealCombosOpen] = useState(true);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  
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

  const [editingCombo, setEditingCombo] = useState(null);

  // Load data from database or sample data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ingredients, combos] = await Promise.all([
        getIngredientsData(),
        getMealCombosData()
      ]);
      setMealCombos(combos);
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
      // Recalculate daily calories and macros
      const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      const totalMacros = meals.reduce((acc, meal) => ({
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat
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

  const addMealToToday = (meal) => {
    const mealWithId = { ...meal, id: Date.now(), timestamp: new Date().toLocaleTimeString() };
    setTodaysMeals(prev => [...prev, mealWithId]);
    setDailyCalories(prev => prev + meal.calories);
    setDailyMacros(prev => ({
      protein: prev.protein + meal.protein,
      carbs: prev.carbs + meal.carbs,
      fat: prev.fat + meal.fat
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
        protein: prev.protein - meal.protein,
        carbs: prev.carbs - meal.carbs,
        fat: prev.fat - meal.fat
      }));
    }
  };

  const handleEditCombo = (combo) => {
    setEditingCombo(combo);
    setIsComboDialogOpen(true);
  };

  const handleComboDialogClose = () => {
    setIsComboDialogOpen(false);
    setEditingCombo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                NutriTrack
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Smart calorie tracking made simple</p>
            </div>
            <div className="flex gap-1 sm:gap-2">
              {/* Test button */}
              <Button 
                onClick={() => {
                  fetch('/api/ingredients')
                    .then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error('Error:', error));
                }}
                variant="outline"
                size="sm"
                className="border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3"
              > API Fetch
              </Button>
              <Button 
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Settings</span>
              </Button>
              <Button 
                onClick={() => setIsComboDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-2 sm:px-3"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Create Combo</span>
              </Button>
              <Button 
                onClick={() => setIsLogDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Log Meal</span>
              </Button>
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
                    <div className="text-sm opacity-90 mb-2">Macronutrients</div>
                    
                    {/* Protein */}
                    {visibleMacros.protein && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span>Protein</span>
                          <span>{Math.round(dailyMacros.protein)}g / {macroGoals.protein}g</span>
                        </div>
                        <Progress value={macroProgress.protein} className="h-1.5 sm:h-2 bg-white/20" />
                      </div>
                    )}
                    
                    {/* Carbs */}
                    {visibleMacros.carbs && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span>Carbs</span>
                          <span>{Math.round(dailyMacros.carbs)}g / {macroGoals.carbs}g</span>
                        </div>
                        <Progress value={macroProgress.carbs} className="h-1.5 sm:h-2 bg-white/20" />
                      </div>
                    )}
                    
                    {/* Fat */}
                    {visibleMacros.fat && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span>Fat</span>
                          <span>{Math.round(dailyMacros.fat)}g / {macroGoals.fat}g</span>
                        </div>
                        <Progress value={macroProgress.fat} className="h-1.5 sm:h-2 bg-white/20" />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{dailyGoal - dailyCalories}</div>
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

          {/* Quick Stats */}
          <Collapsible open={isQuickStatsOpen} onOpenChange={setIsQuickStatsOpen}>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 sm:pb-6 cursor-pointer hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-emerald-700 text-lg sm:text-xl">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                      Quick Stats
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isQuickStatsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
                      <span className="font-semibold text-emerald-600 text-sm sm:text-base">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    {showMacros && (
                      <>
                        {visibleMacros.protein && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Protein</span>
                            <span className="font-semibold text-blue-600 text-sm sm:text-base">
                              {Math.round(macroProgress.protein)}%
                            </span>
                          </div>
                        )}
                        {visibleMacros.carbs && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Carbs</span>
                            <span className="font-semibold text-orange-600 text-sm sm:text-base">
                              {Math.round(macroProgress.carbs)}%
                            </span>
                          </div>
                        )}
                        {visibleMacros.fat && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Fat</span>
                            <span className="font-semibold text-purple-600 text-sm sm:text-base">
                              {Math.round(macroProgress.fat)}%
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Goal status</span>
                      <span className={`text-xs sm:text-sm font-semibold ${
                        progressPercentage >= 100 ? 'text-emerald-600' : 
                        progressPercentage >= 75 ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {progressPercentage >= 100 ? 'Complete!' : 
                         progressPercentage >= 75 ? 'Almost there' : 'On track'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Today's Meals */}
        <Collapsible open={isTodaysMealsOpen} onOpenChange={setIsTodaysMealsOpen} className="mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    Today's Meals
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isTodaysMealsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <TodaysMeals 
                  meals={todaysMeals} 
                  onRemoveMeal={removeMealFromToday}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Available Meal Combos */}
        <Collapsible open={isMealCombosOpen} onOpenChange={setIsMealCombosOpen}>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    Available Meal Combos
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMealCombosOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading meal combos...</div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mealCombos.map((combo) => (
                      <Card key={combo.id} className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <h3 className="font-semibold text-sm sm:text-base">
                              {combo.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCombo(combo)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this meal combo?')) {
                                    try {
                                      await deleteMealCombo(combo.id);
                                      loadData(); // Refresh the list
                                      toast({
                                        title: "Meal combo deleted",
                                        description: `${combo.name} has been removed.`,
                                      });
                                    } catch (error) {
                                      console.error('Error deleting meal combo:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to delete meal combo. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                            {combo.ingredients.join(", ")}
                          </p>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-xs text-muted-foreground">
                              P: {combo.protein}g | C: {combo.carbs}g | F: {combo.fat}g
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => addMealToToday(combo)}
                              className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                            >
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Ingredients Manager */}
        <Collapsible open={isIngredientsOpen} onOpenChange={setIsIngredientsOpen} className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    Manage Ingredients
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isIngredientsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <IngredientManager />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </main>

      {/* Dialogs */}
      <MealComboDialog 
        open={isComboDialogOpen} 
        onOpenChange={handleComboDialogClose}
        onSave={loadData}
        editingCombo={editingCombo}
      />
      <MealLogDialog 
        open={isLogDialogOpen} 
        onOpenChange={setIsLogDialogOpen}
        onAddMeal={addMealToToday}
      />
      <SettingsMenu
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        dailyGoal={dailyGoal}
        onDailyGoalChange={setDailyGoal}
        macroGoals={macroGoals}
        onMacroGoalsChange={setMacroGoals}
        visibleMacros={visibleMacros}
        onVisibleMacrosChange={setVisibleMacros}
      />
    </div>
  );
};

export default Index;
