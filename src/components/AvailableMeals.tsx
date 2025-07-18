import { useState } from "react";
import { TrendingUp, MoreVertical, Pencil, Trash2, Pizza, Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  SearchBar,
} from "./ui";
import { AlertModal } from "./modals";
import IngredientListSummaryText from "./IngredientListSummaryText";
import MacroSummaryText from "./MacroSummaryText";
import { modManager } from "@/lib/mods";
import { ModMeal } from "@/types/mods";

const AvailableMeals = ({
  searchQuery,
  setSearchQuery,
  addMealToToday,
  openMealEditManagement,
  handleDeleteMealCombo,
  filteredMeals,
  onModMealClick,
}) => {
  const [deleteMealId, setDeleteMealId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get enabled mods
  const enabledMods = modManager.getEnabledMods();

  const handleDeleteClick = (id: number) => {
    setDeleteMealId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMealId) return;

    try {
      await handleDeleteMealCombo(deleteMealId);
    } finally {
      setShowDeleteDialog(false);
      setDeleteMealId(null);
    }
  };

  const AvailableMealCard = ({ meal }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <h3 className={`font-semibold ${meal.meal_type === 'standalone' ? 'text-yellow-500' : ''} group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm sm:text-base line-clamp-2`}>
            {meal.name || "Unnamed Meal"}
          </h3>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 ml-2 flex-shrink-0">
            {meal.calories}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
          {meal.meal_type === 'composed' &&
            <IngredientListSummaryText meal={meal} />
          }
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <MacroSummaryText data={meal} />
          <div className="flex gap-1 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => addMealToToday(meal)}
              className="bg-emerald-500 hover:bg-emerald-600 flex-1 sm:flex-none transition-all duration-150 hover:scale-105 active:scale-95"
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
                  openMealEditManagement(meal.id);
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(meal.id)}
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
  );

  const ModMealCard = ({ mod }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-700">
      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors text-sm sm:text-base line-clamp-2">
              {mod.name}
            </h3>
          </div>
          <span className="text-xs text-purple-500 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
            MOD
          </span>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
          {mod.description}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Click to configure and calculate
          </div>
          <div className="flex gap-1 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => onModMealClick(mod)}
              className="bg-purple-500 hover:bg-purple-600 flex-1 sm:flex-none transition-all duration-150 hover:scale-105 active:scale-95"
            >
              Configure
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
              Available Meals
            </CardTitle>
            {/* Search Bar */}
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Regular Meals */}
            {filteredMeals.length > 0 && (
              filteredMeals.map((meal) => (
                <AvailableMealCard key={meal.id} meal={meal} />
              ))
            )}
            
            {/* Mod Meals */}
            {enabledMods.length > 0 && (
              enabledMods.map((mod) => (
                <ModMealCard key={mod.id} mod={mod} />
              ))
            )}
            
            {/* Empty State */}
            {filteredMeals.length === 0 && enabledMods.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "No meals found matching your search." : "No meal combos available."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertModal
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteConfirm={handleDeleteConfirm}
        title="Delete Meal"
        description="Are you sure you want to delete this meal? This action cannot be undone."
      />
    </>
  );
};

export default AvailableMeals;