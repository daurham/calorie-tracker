import { useState } from "react";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Collapsible, 
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui";

interface QuickStatsProps {
  todaysMeals: any[];
  dailyCalories: number;
  progressPercentage: number;
  showMacros: boolean;
  visibleMacros: {
    protein: boolean;
    carbs: boolean;
    fat: boolean;
  };
  macroProgress: {
    protein: number;
    carbs: number;
    fat: number;
  };
  formatMacroProgress: (progress: number | string) => string;
}

const QuickStats = ({
  todaysMeals,
  dailyCalories,
  progressPercentage,
  showMacros,
  visibleMacros,
  macroProgress,
  formatMacroProgress
}: QuickStatsProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const statsContent = (
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
  );

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-6">
        {/* Mobile: Collapsible */}
        <div className="block sm:hidden">
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-lg sm:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Quick Stats
                </CardTitle>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                {statsContent}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Desktop: Always visible */}
        <div className="hidden sm:block">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-lg sm:text-xl">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Quick Stats
          </CardTitle>
          <CardContent className="pt-4">
            {statsContent}
          </CardContent>
        </div>
      </CardHeader>
    </Card>
  );
};

export default QuickStats; 