import { useState } from "react";
import { Trash2, Clock, ChevronDown, ChevronRight, Sparkles, Edit3, Copy } from "lucide-react";
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
import TodaysMealsEditModal from "./modals/TodaysMealsEditModal";
interface TodaysMealsProps {
  meals: any[];
  availableIngredients: any[];
  onRemoveMeal: (id: any) => void;
  onUpdateMeal: (updatedMeal: any) => void;
  onDuplicateMeal: (duplicatedMeal: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const groupTodaysMeals = (meals: any[]) => {
  const groups = new Map<string, any[]>();
  const order: Array<{ key: string; meals: any[]; grouped: boolean }> = [];
  for (const meal of meals) {
    const groupId = meal.foodLogGroupId;
    if (groupId) {
      const existing = groups.get(groupId);
      if (existing) {
        existing.push(meal);
        continue;
      }
      const next = [meal];
      groups.set(groupId, next);
      order.push({ key: groupId, meals: next, grouped: true });
      continue;
    }
    order.push({ key: String(meal.uniqueMealId ?? meal.foodLogId ?? meal.id), meals: [meal], grouped: false });
  }
  return order.map(entry => ({
    ...entry,
    grouped: entry.grouped && entry.meals.length > 1,
  }));
};

const TodaysMeals = ({ meals, availableIngredients, onRemoveMeal, onUpdateMeal, onDuplicateMeal, isCollapsed, setIsCollapsed }: TodaysMealsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
                  {meal.isEdited && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      Edited
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
                {meal.servingDescription
                  || meal.ingredients?.map(i => i.name).filter(Boolean).join(", ")
                  || (meal.sourceType === 'quick_calories' ? 'Quick calories' : '')}
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
                onClick={() => {
                  setEditingMeal(meal);
                  setIsEditModalOpen(true);
                }}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 px-2 h-8"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicateMeal({ ...meal, uniqueMealId: generateUniqueId() })}
                className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 px-2 h-8"
                aria-label="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMeal(meal.uniqueMealId)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 px-2 h-8"
                aria-label="Delete"
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
                  Today
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
                  <p className="text-sm sm:text-base">Nothing logged yet.</p>
                  <p className="text-xs sm:text-sm">Use Quick Log above to add food.</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    );
  }


  return (
    <>
      <Card className="mb-6 sm:mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  Today ({meals.length})
                </CardTitle>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
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
                  {groupTodaysMeals(meals).map((entry) => {
                    if (!entry.grouped) {
                      return <TodaysMealCard key={entry.key} meal={entry.meals[0]} />;
                    }
                    const totalCalories = entry.meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
                    const expanded = Boolean(expandedGroups[entry.key]);
                    return (
                      <div key={entry.key} className="space-y-2">
                        <button
                          type="button"
                          className="w-full rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-left dark:border-emerald-800 dark:bg-emerald-950/40"
                          onClick={() => setExpandedGroups(prev => ({ ...prev, [entry.key]: !prev[entry.key] }))}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-sm">{entry.meals.map(meal => meal.name).join(', ')}</p>
                              <p className="text-xs text-muted-foreground">{entry.meals.length} foods</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{totalCalories}</p>
                              <p className="text-xs text-muted-foreground">{expanded ? 'Hide' : 'Show'}</p>
                            </div>
                          </div>
                        </button>
                        {expanded && entry.meals.map(meal => (
                          <TodaysMealCard key={meal.uniqueMealId ?? meal.foodLogId} meal={meal} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

          {/* Edit Modal */}
    <TodaysMealsEditModal
      open={isEditModalOpen}
      onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setEditingMeal(null);
        }
      }}
      meals={meals}
      editingMeal={editingMeal}
      availableIngredients={availableIngredients}
      onUpdateMeal={onUpdateMeal}
      onDuplicateMeal={onDuplicateMeal}
      onRemoveMeal={onRemoveMeal}
      onUpdateEditingMeal={setEditingMeal}
    />
    </>
  );
};

export default TodaysMeals;
