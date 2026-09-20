import { useState, useEffect } from "react";
import { TrendingUp, MoreVertical, Pencil, Trash2, Sparkles, Loader2, ChevronDown, ChevronRight, Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  SearchBar,
  Skeleton,
} from "./ui";
import { AlertModal } from "./modals";
import IngredientListSummaryText from "./IngredientListSummaryText";
import MacroSummaryText from "./MacroSummaryText";

const AvailableMeals = ({
  searchQuery,
  setSearchQuery,
  addMealToToday,
  openMealEditManagement,
  handleDeleteMealCombo,
  filteredMeals,
  onModMealClick,
  isLoading = false,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const [deleteMealId, setDeleteMealId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customPortionMeal, setCustomPortionMeal] = useState(null);
  const [customPortionValue, setCustomPortionValue] = useState("");
  const [showCustomPortionDialog, setShowCustomPortionDialog] = useState(false);
  const [favorites, setFavorites] = useState<Array<number | string>>([]);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('availableMealsFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('availableMealsFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (mealId: number | string) => {
    setFavorites(prev => {
      if (prev.includes(mealId)) {
        return prev.filter(id => id !== mealId);
      } else {
        return [...prev, mealId];
      }
    });
  };

  const isFavorite = (mealId: number | string) => favorites.includes(mealId);

  // Favorites first, then recent/frequent foods, then the rest alphabetically.
  const sortedMeals = [...filteredMeals].sort((a, b) => {
    const aIsFavorite = isFavorite(a.id);
    const bIsFavorite = isFavorite(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    if (aIsFavorite && bIsFavorite) {
      return favorites.indexOf(a.id) - favorites.indexOf(b.id);
    }

    const aIsRecent = a.origin === 'recent';
    const bIsRecent = b.origin === 'recent';
    if (aIsRecent && !bIsRecent) return -1;
    if (!aIsRecent && bIsRecent) return 1;
    
    return (a.name || "").localeCompare(b.name || "");
  });



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
      <CardContent className="p-3 sm:p-4 grid grid-rows-[auto_auto_1fr] h-full">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className={`font-semibold ${meal.meal_type === 'standalone' ? 'text-yellow-500' : ''} group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm sm:text-base line-clamp-2`}>
              {meal.name || "Unnamed Meal"}
            </h3>
            {meal.origin === 'recent' && (
              <span className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded flex-shrink-0">
                Recent
              </span>
            )}
            {isFavorite(meal.id) && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 ml-2 flex-shrink-0">
            {meal.calories}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 min-h-[1.5rem]">
          {meal.origin === 'recent' && (meal.servingDescription || 'Recently logged')}
          {meal.origin !== 'recent' && meal.meal_type === 'composed' &&
            <IngredientListSummaryText meal={meal} />
          }
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 self-end">
          <MacroSummaryText data={meal} />
          <div className="flex gap-1 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => addMealToToday(meal)}
                  className="bg-emerald-500 hover:bg-emerald-600 flex-1 sm:flex-none transition-all duration-150 hover:scale-105 active:scale-95 mobile-button-layout"
                >
                  <div className="flex items-center justify-center sm:justify-start w-full">
                    <span>Add</span>
                    <ChevronDown className="h-3 w-3 ml-1 sm:ml-1" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addMealToToday(meal)}>
                  Add Full Meal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addMealToToday({ ...meal, portion: 0.5 })}>
                  Add ½ Meal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addMealToToday({ ...meal, portion: 0.33 })}>
                  Add ⅓ Meal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addMealToToday({ ...meal, portion: 0.25 })}>
                  Add ¼ Meal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setCustomPortionMeal(meal);
                    setCustomPortionValue("");
                    setShowCustomPortionDialog(true);
                  }}
                >
                  Custom portion...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleFavorite(meal.id)}>
                  <Star className={`h-4 w-4 mr-2 ${isFavorite(meal.id) ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  {isFavorite(meal.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
                {meal.origin !== 'recent' && (
                  <>
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
                  </>
                )}
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors text-sm sm:text-base line-clamp-2">
              {mod.name}
            </h3>
            {isFavorite(mod.id) && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => onModMealClick(mod)}
                  className="bg-purple-500 hover:bg-purple-600 flex-1 sm:flex-none transition-all duration-150 hover:scale-105 active:scale-95 mobile-button-layout"
                >
                  <div className="flex items-center justify-center sm:justify-start w-full">
                    <span>Configure</span>
                    <ChevronDown className="h-3 w-3 ml-1 sm:ml-1" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onModMealClick(mod)}>
                  Configure Mod
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleFavorite(mod.id)}>
                  <Star className={`h-4 w-4 mr-2 ${isFavorite(mod.id) ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  {isFavorite(mod.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const LoadingSkeletonCard = () => (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="space-y-2 mb-2 sm:mb-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="flex gap-1 w-full sm:w-auto">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed?.(!open)}>
          <CardHeader>
            <div className="space-y-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
                >
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-600 dark:text-slate-300">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                    Available Meals
                  </CardTitle>
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </CollapsibleContent>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <LoadingSkeletonCard key={`skeleton-${index}`} />
                  ))
                ) : sortedMeals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No meals found matching your search." : "No meal combos available."}
                  </p>
                ) : (
                  sortedMeals.map((item) => {
                    const isMod = item.description && !item.meal_type;
                    if (isMod) {
                      return <ModMealCard key={`mod-${item.id}`} mod={item} />;
                    }
                    return <AvailableMealCard key={`meal-${item.id}`} meal={item} />;
                  })
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AlertModal
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteConfirm={handleDeleteConfirm}
        title="Delete Meal"
        description="Are you sure you want to delete this meal? This action cannot be undone."
      />

      {/* Custom Portion Dialog */}
      {showCustomPortionDialog && customPortionMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Custom Portion</h3>
            <p className="text-sm text-muted-foreground mb-4">
              How much of "{customPortionMeal.name}" did you eat?
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Portion (0.1 - 2.0)</label>
                <input
                  type="number"
                  value={customPortionValue}
                  onChange={(e) => setCustomPortionValue(e.target.value)}
                  placeholder="e.g., 0.75 for ¾"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                  min="0.1"
                  max="2.0"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const portion = parseFloat(customPortionValue);
                    if (portion >= 0.1 && portion <= 2.0) {
                      addMealToToday({ ...customPortionMeal, portion });
                      setShowCustomPortionDialog(false);
                      setCustomPortionMeal(null);
                      setCustomPortionValue("");
                    }
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomPortionDialog(false);
                    setCustomPortionMeal(null);
                    setCustomPortionValue("");
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailableMeals;