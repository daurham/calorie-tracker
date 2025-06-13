
import { useState, useEffect } from "react";
import { Plus, Target, TrendingUp, Calendar, Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import MealComboDialog from "@/components/MealComboDialog";
import MealLogDialog from "@/components/MealLogDialog";
import TodaysMeals from "@/components/TodaysMeals";
import { sampleMealCombos } from "@/data/sampleData";

const Index = () => {
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [showMacros, setShowMacros] = useState(false);
  
  // Configurable goals - could be moved to settings later
  const dailyGoal = 2000;
  const macroGoals = {
    protein: 150, // grams
    carbs: 200,   // grams
    fat: 70       // grams
  };
  
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                NutriTrack
              </h1>
              <p className="text-sm text-muted-foreground">Smart calorie tracking made simple</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsComboDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Combo
              </Button>
              <Button 
                onClick={() => setIsLogDialogOpen(true)}
                variant="outline"
                className="border-emerald-200 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Daily Progress Section */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-blue-600 text-white border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Today's Progress
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMacros(!showMacros)}
                  className="text-white hover:bg-white/20"
                >
                  {showMacros ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Calorie Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Calories consumed</span>
                  <span className="font-bold">{dailyCalories} / {dailyGoal}</span>
                </div>
                <Progress value={progressPercentage} className="h-3 bg-white/20" />
                
                {/* Macro Progress */}
                {showMacros && (
                  <div className="space-y-3 pt-4 border-t border-white/20">
                    <div className="text-sm opacity-90 mb-2">Macronutrients</div>
                    
                    {/* Protein */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Protein</span>
                        <span>{Math.round(dailyMacros.protein)}g / {macroGoals.protein}g</span>
                      </div>
                      <Progress value={macroProgress.protein} className="h-2 bg-white/20" />
                    </div>
                    
                    {/* Carbs */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Carbs</span>
                        <span>{Math.round(dailyMacros.carbs)}g / {macroGoals.carbs}g</span>
                      </div>
                      <Progress value={macroProgress.carbs} className="h-2 bg-white/20" />
                    </div>
                    
                    {/* Fat */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Fat</span>
                        <span>{Math.round(dailyMacros.fat)}g / {macroGoals.fat}g</span>
                      </div>
                      <Progress value={macroProgress.fat} className="h-2 bg-white/20" />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{dailyGoal - dailyCalories}</div>
                    <div className="text-sm opacity-90">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{todaysMeals.length}</div>
                    <div className="text-sm opacity-90">Meals logged</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Calendar className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg. per meal</span>
                  <span className="font-semibold">
                    {todaysMeals.length > 0 ? Math.round(dailyCalories / todaysMeals.length) : 0} cal
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="font-semibold text-emerald-600">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                {showMacros && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Protein</span>
                      <span className="font-semibold text-blue-600">
                        {Math.round(macroProgress.protein)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Carbs</span>
                      <span className="font-semibold text-orange-600">
                        {Math.round(macroProgress.carbs)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fat</span>
                      <span className="font-semibold text-purple-600">
                        {Math.round(macroProgress.fat)}%
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Goal status</span>
                  <span className={`text-sm font-semibold ${
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Available Meal Combos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sampleMealCombos.map((combo) => (
                <Card key={combo.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold group-hover:text-emerald-600 transition-colors">
                        {combo.name}
                      </h3>
                      <span className="text-lg font-bold text-emerald-600">
                        {combo.calories} cal
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {combo.ingredients.join(", ")}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        P: {combo.protein}g | C: {combo.carbs}g | F: {combo.fat}g
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addMealToToday(combo)}
                        className="bg-emerald-500 hover:bg-emerald-600"
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
    </div>
  );
};

export default Index;
