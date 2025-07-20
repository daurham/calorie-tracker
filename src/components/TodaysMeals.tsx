import { useState } from "react";
import { Trash2, Clock, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
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
import { generateUniqueId } from "@/lib/utils";
import MacroSummaryText from "./MacroSummaryText";
interface TodaysMealsProps {
  meals: any[];
  onRemoveMeal: (id: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const TodaysMeals = ({ meals, onRemoveMeal, isCollapsed, setIsCollapsed }: TodaysMealsProps) => {

  const TodaysMealCard = ({ meal }) => (
    <Card className="bg-gradient-to-r from-white to-emerald-50 dark:from-slate-800 dark:to-emerald-950 border-emerald-100 dark:border-emerald-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{meal.name}</h3>
                  {meal.modData && (
                    <Sparkles className="h-3 w-3 text-purple-500" />
                  )}
                  {meal.portion && meal.portion !== 1 && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                      {meal.portion === 0.5 ? '½' : 
                       meal.portion === 0.33 ? '⅓' : 
                       meal.portion === 0.25 ? '¼' : 
                       meal.portion === 0.75 ? '¾' :
                       meal.portion === 0.67 ? '⅔' :
                       `${Math.round(meal.portion * 100)}%`}
                    </span>
                  )}
                </div>
                {meal.timestamp && (
                  <span className="text-xs sm:text-sm text-muted-foreground bg-white dark:bg-slate-700 px-2 py-1 rounded w-fit">
                    {meal.timestamp}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                {meal.ingredients.map(i => i.name).join(", ")}
                {meal.weight && (
                  <span className="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                    ({meal.weight}g)
                  </span>
                )}
              </p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {meal.calories}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">calories</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <MacroSummaryText data={meal} showCalories={false} />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMeal(meal.uniqueMealId)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 px-2 h-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
  if (meals.length === 0) {
    return (
      <Card className="mb-6 sm:mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  Today's Meals
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
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <p className="text-sm sm:text-base">No meals logged today yet.</p>
                  <p className="text-xs sm:text-sm">Start by logging your first meal!</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    );
  }


  if (meals.length === 1) {
    return (
      <Card className="mb-6 sm:mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  Today's Meals ({meals.length})
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
                <div className="space-y-3">
                  {meals.map((meal) => (
                    <TodaysMealCard key={generateUniqueId()} meal={meal} />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6 sm:mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader>
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  Today's Meals ({meals.length})
                </CardTitle>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            {meals.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMeal("all")}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 px-2 h-0 py-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {meals.map((meal) => (
                  <TodaysMealCard key={generateUniqueId()} meal={meal} />
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};

export default TodaysMeals;
