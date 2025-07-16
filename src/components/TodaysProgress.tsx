import { Target, Eye, EyeOff } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import { formatMacros } from "@/lib/utils";

interface TodaysProgressProps {
  dailyCalories: number;
  dailyGoal: number;
  dailyMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  visibleMacros: {
    protein: boolean;
    carbs: boolean;
    fat: boolean;
  };
  showMacros: boolean;
  setShowMacros: (show: boolean) => void;
  todaysMeals: any[];
}

const TodaysProgress = ({
  dailyCalories,
  dailyGoal,
  dailyMacros,
  macroGoals,
  visibleMacros,
  showMacros,
  setShowMacros,
  todaysMeals
}: TodaysProgressProps) => {
  const progressPercentage = dailyGoal > 0 ? Math.min((dailyCalories / dailyGoal) * 100, 100) : 0;

  const macroProgress = {
    protein: macroGoals.protein > 0 ? Math.min((dailyMacros.protein / macroGoals.protein) * 100, 100) : 0,
    carbs: macroGoals.carbs > 0 ? Math.min((dailyMacros.carbs / macroGoals.carbs) * 100, 100) : 0,
    fat: macroGoals.fat > 0 ? Math.min((dailyMacros.fat / macroGoals.fat) * 100, 100) : 0
  };

  return (
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
  );
};

export default TodaysProgress; 