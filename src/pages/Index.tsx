
import { useState, useEffect } from "react";
import { Plus, Target, TrendingUp, Calendar, Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import MealComboDialog from "@/components/MealComboDialog";
import MealLogDialog from "@/components/MealLogDialog";
import TodaysMeals from "@/components/TodaysMeals";
import MacroSettings from "@/components/MacroSettings";
import { sampleMealCombos } from "@/data/sampleData";

const Index = () => {
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [showMacros, setShowMacros] = useState(false);
  
  // Configurable goals
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [macroGoals, setMacroGoals] = useState({
    protein: 150, // grams
    carbs: 200,   // grams
    fat: 70       // grams
  });
  
  const [visibleMacros, setVisibleMacros] = useState({
    protein: true,
    carbs: true,
    fat: true
  });
  
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

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-emerald-700 text-lg sm:text-xl">
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
          </Card>
        </div>

        {/* Today's Meals */}
        <TodaysMeals 
          meals={todaysMeals} 
          onRemoveMeal={removeMealFromToday}
        />

        {/* Available Meal Combos */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              Available Meal Combos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sampleMealCombos.map((combo) => (
                <Card key={combo.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <h3 className="font-semibold group-hover:text-emerald-600 transition-colors text-sm sm:text-base">
                        {combo.name}
                      </h3>
                      <span className="text-lg sm:text-xl font-bold text-emerald-600 ml-2">
                        {combo.calories}
                      </span>
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
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <MealComboDialog 
        open={isComboDialogOpen} 
        onOpenChange={setIsComboDialogOpen}
      />
      <MealLogDialog 
        open={isLogDialogOpen} 
        onOpenChange={setIsLogDialogOpen}
        onAddMeal={addMealToToday}
      />
      <MacroSettings
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        macroGoals={macroGoals}
        onMacroGoalsChange={setMacroGoals}
        visibleMacros={visibleMacros}
        onVisibleMacrosChange={setVisibleMacros}
      />
    </div>
  );
};

export default Index;
