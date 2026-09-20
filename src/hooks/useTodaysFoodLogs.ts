import { useEffect, useMemo, useRef, useState } from 'react';
import { generateUniqueId, type LoggedMeal } from '@/lib/utils';
import {
  TODAYS_MEALS_STORAGE_KEY,
  applyPortionToMeal,
  createFoodLog,
  createFoodLogs,
  deleteFoodLog,
  deleteFoodLogsInGroup,
  deleteFoodLogsInRange,
  foodLogToLoggedMeal,
  getFoodLogs,
  getLocalDayRange,
  getRecentFoodLogs,
  loggedMealToFoodLogInput,
  migrateLegacyTodaysMealsIfNeeded,
  readLegacyTodaysMeals,
  sumFoodLogNutrition,
  updateFoodLog,
} from '@/lib/food-logs';
import {
  deriveRecentFrequent,
  foodLogToInput,
  planUndo,
  type UndoAction,
} from '@/lib/quick-log';
import type { CreateFoodLogsRequest, FoodLog, FoodLogInput } from '@/types/food-log';

const isInLocalDay = (loggedAt: string) => {
  const range = getLocalDayRange();
  const time = new Date(loggedAt).getTime();
  return time >= new Date(range.from).getTime() && time < new Date(range.to).getTime();
};

export function useTodaysFoodLogs() {
  const [todaysMeals, setTodaysMeals] = useState<LoggedMeal[]>(() => readLegacyTodaysMeals());
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<FoodLog[]>([]);
  const [isLogsReady, setIsLogsReady] = useState(false);
  const [pendingLogId, setPendingLogId] = useState<number | string | null>(null);
  const [isLogMutating, setIsLogMutating] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const undoActionRef = useRef<UndoAction | null>(null);

  const dailyTotals = useMemo(() => sumFoodLogNutrition(todaysMeals), [todaysMeals]);
  const recentFrequent = useMemo(() => deriveRecentFrequent(recentLogs), [recentLogs]);

  const persistMirror = (meals: LoggedMeal[]) => {
    localStorage.setItem(TODAYS_MEALS_STORAGE_KEY, JSON.stringify(meals));
  };

  const applyTodayLogs = (logs: FoodLog[]) => {
    setFoodLogs(logs);
    const nextMeals = logs.map(foodLogToLoggedMeal);
    setTodaysMeals(nextMeals);
    persistMirror(nextMeals);
    return nextMeals;
  };

  const loadTodaysLogs = async () => {
    const response = await getFoodLogs(getLocalDayRange());
    return applyTodayLogs(response.logs);
  };

  const loadRecentLogs = async () => {
    try {
      const response = await getRecentFoodLogs(80);
      setRecentLogs(response.logs);
      return response.logs;
    } catch (error) {
      console.error('Error loading recent food logs:', error);
      return [];
    }
  };

  const rememberRecent = (log: FoodLog) => {
    setRecentLogs(prev => [log, ...prev.filter(existing => existing.id !== log.id)]);
  };

  const forgetRecent = (logId: number) => {
    setRecentLogs(prev => prev.filter(existing => existing.id !== logId));
  };

  const notifyUndo = (action: UndoAction) => {
    undoActionRef.current = action;
    setUndoAction(action);
  };

  const insertCreatedLog = (created: FoodLog) => {
    if (isInLocalDay(created.logged_at)) {
      setFoodLogs(prev => [...prev.filter(existing => existing.id !== created.id), created]);
      setTodaysMeals(prev => {
        const without = prev.filter(meal => meal.foodLogId !== created.id);
        return [...without, foodLogToLoggedMeal(created)];
      });
    }
    rememberRecent(created);
  };

  const removeCreatedLog = (logId: number) => {
    setFoodLogs(prev => prev.filter(existing => existing.id !== logId));
    setTodaysMeals(prev => prev.filter(meal => meal.foodLogId !== logId && meal.uniqueMealId !== logId));
    forgetRecent(logId);
  };

  const performUndo = async (action: UndoAction) => {
    const plan = planUndo(action);
    setIsLogMutating(true);
    try {
      if (plan.op === 'delete-group') {
        const result = await deleteFoodLogsInGroup(plan.groupId, plan.logIds);
        result.logs.forEach(log => removeCreatedLog(log.id));
      } else if (plan.op === 'delete') {
        await deleteFoodLog(plan.logId);
        removeCreatedLog(plan.logId);
      } else {
        const created = await createFoodLog(plan.snapshot);
        insertCreatedLog(created);
      }
      if (undoActionRef.current === action) {
        undoActionRef.current = null;
        setUndoAction(null);
      }
    } catch (error) {
      console.error('Error undoing food log change:', error);
      throw error;
    } finally {
      setIsLogMutating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        await migrateLegacyTodaysMealsIfNeeded();
        if (cancelled) return;
        await Promise.all([loadTodaysLogs(), loadRecentLogs()]);
      } catch (error) {
        console.error('Error loading food logs:', error);
      } finally {
        if (!cancelled) {
          setIsLogsReady(true);
        }
      }
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistMirror(todaysMeals);
  }, [todaysMeals]);

  const persistMealSnapshot = async (
    meal: LoggedMeal,
    undoType: 'add' | 'duplicate' = 'add'
  ) => {
    setTodaysMeals(prev => [...prev, meal]);
    setIsLogMutating(true);
    try {
      const created = await createFoodLog(loggedMealToFoodLogInput(meal));
      setFoodLogs(prev => [...prev.filter(existing => existing.id !== created.id), created]);
      setTodaysMeals(prev =>
        prev.map(existing =>
          existing.uniqueMealId === meal.uniqueMealId
            ? foodLogToLoggedMeal(created)
            : existing
        )
      );
      rememberRecent(created);
      notifyUndo({
        type: undoType,
        logId: created.id,
        label: created.display_name,
        calories: created.calories,
      });
      return created;
    } catch (error) {
      console.error('Error creating food log:', error);
      setTodaysMeals(prev => prev.filter(existing => existing.uniqueMealId !== meal.uniqueMealId));
      throw error;
    } finally {
      setIsLogMutating(false);
    }
  };

  const logFood = async (input: FoodLogInput) => {
    setIsLogMutating(true);
    try {
      const created = await createFoodLog(input);
      insertCreatedLog(created);
      notifyUndo({
        type: 'add',
        logId: created.id,
        label: created.display_name,
        calories: created.calories,
      });
      return created;
    } catch (error) {
      console.error('Error creating food log:', error);
      throw error;
    } finally {
      setIsLogMutating(false);
    }
  };

  const logFoods = async (payload: CreateFoodLogsRequest) => {
    setIsLogMutating(true);
    try {
      const created = await createFoodLogs(payload);
      created.logs.forEach(insertCreatedLog);
      const first = created.logs[0];
      const group = created.groups[0];
      if (group && created.logs.length > 1) {
        notifyUndo({
          type: 'add-group',
          groupId: group.id,
          logIds: created.logs.map(log => log.id),
          label: group.display_name || created.logs.map(log => log.display_name).join(', '),
          calories: created.logs.reduce((sum, log) => sum + log.calories, 0),
        });
      } else if (first) {
        notifyUndo({
          type: 'add',
          logId: first.id,
          label: first.display_name,
          calories: first.calories,
        });
      }
      return created;
    } catch (error) {
      console.error('Error creating food logs:', error);
      throw error;
    } finally {
      setIsLogMutating(false);
    }
  };

  const addMealToToday = async (meal: LoggedMeal | Record<string, any>) => {
    try {
      await persistMealSnapshot(applyPortionToMeal(meal as LoggedMeal));
    } catch {
      // Rolled back locally; existing meal-library callers do not handle throws.
    }
  };

  const removeMealFromToday = async (mealId: number | string) => {
    if (mealId === 'all') {
      const previousMeals = todaysMeals;
      const previousLogs = foodLogs;
      setTodaysMeals([]);
      setFoodLogs([]);
      setPendingLogId('all');
      try {
        await deleteFoodLogsInRange(getLocalDayRange());
      } catch (error) {
        console.error('Error clearing food logs:', error);
        setTodaysMeals(previousMeals);
        setFoodLogs(previousLogs);
      } finally {
        setPendingLogId(null);
      }
      return;
    }

    const target = todaysMeals.find(meal => meal.uniqueMealId === mealId || meal.foodLogId === mealId);
    const targetLog = foodLogs.find(log => log.id === target?.foodLogId || log.id === mealId);
    setTodaysMeals(prev => prev.filter(meal => meal.uniqueMealId !== mealId && meal.foodLogId !== mealId));
    const serverId = target?.foodLogId ?? (typeof mealId === 'number' ? mealId : null);
    if (!serverId) return;
    setPendingLogId(serverId);
    setFoodLogs(prev => prev.filter(log => log.id !== serverId));
    try {
      await deleteFoodLog(serverId);
      forgetRecent(serverId);
      const snapshot = targetLog ? foodLogToInput(targetLog) : target ? loggedMealToFoodLogInput(target) : null;
      if (snapshot) {
        notifyUndo({
          type: 'delete',
          snapshot,
          label: snapshot.display_name,
          calories: snapshot.calories,
        });
      }
    } catch (error) {
      console.error('Error deleting food log:', error);
      if (target) {
        setTodaysMeals(prev => [...prev, target]);
      }
      if (targetLog) {
        setFoodLogs(prev => [...prev, targetLog]);
      }
    } finally {
      setPendingLogId(null);
    }
  };

  const updateMealInToday = async (updatedMeal: LoggedMeal) => {
    setTodaysMeals(prev =>
      prev.map(meal =>
        meal.uniqueMealId === updatedMeal.uniqueMealId || meal.foodLogId === updatedMeal.foodLogId
          ? updatedMeal
          : meal
      )
    );

    const serverId = updatedMeal.foodLogId;
    if (!serverId) return;
    setPendingLogId(serverId);
    try {
      const saved = await updateFoodLog(serverId, loggedMealToFoodLogInput(updatedMeal));
      setFoodLogs(prev => prev.map(log => (log.id === serverId ? saved : log)));
      setTodaysMeals(prev =>
        prev.map(meal =>
          meal.foodLogId === serverId ? foodLogToLoggedMeal(saved) : meal
        )
      );
    } catch (error) {
      console.error('Error updating food log:', error);
    } finally {
      setPendingLogId(null);
    }
  };

  const duplicateMealInToday = async (duplicatedMeal: LoggedMeal) => {
    try {
      await persistMealSnapshot({
        ...duplicatedMeal,
        foodLogId: undefined,
        uniqueMealId: duplicatedMeal.uniqueMealId || generateUniqueId(),
      }, 'duplicate');
    } catch {
      // Rolled back locally.
    }
  };

  return {
    todaysMeals,
    foodLogs,
    recentLogs,
    recentFrequent,
    dailyCalories: dailyTotals.calories,
    dailyMacros: {
      protein: dailyTotals.protein,
      carbs: dailyTotals.carbs,
      fat: dailyTotals.fat,
    },
    isLogsReady,
    isLogMutating,
    pendingLogId,
    undoAction,
    undoLastAction: performUndo,
    addMealToToday,
    removeMealFromToday,
    updateMealInToday,
    duplicateMealInToday,
    logFood,
    logFoods,
    refreshTodaysLogs: loadTodaysLogs,
    refreshRecentLogs: loadRecentLogs,
  };
}
