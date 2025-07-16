import { Pencil, Trash2 } from "lucide-react";
import { SearchBar, Card, CardContent, Button } from "@/components/ui";
import { MealSkeleton } from "@/components/skeletons";
import { useMealManagement } from "./MealManagementContext";
import { Meal } from "@/types";
import IngredientsSummaryText from "@/components/IngredientsSummaryText";
import MacroSummaryText from "@/components/MacroSummaryText";

const printMealIngredients = (meal: Meal) => {
  return meal.ingredients.map(i => i.quantity > 1 ? `${i.name} (${i.quantity}) ${i.unit}` : `${i.name} ${i.unit}`).join(", ");
}

const RightColumnEdit = () => {
  const { filteredMeals, handleEdit, handleDeleteClick, isLoading, searchQuery, setSearchQuery } = useMealManagement();

  return (   
  <div className="space-y-4 min-h-[65vh]">
    <h3 className="text-lg font-semibold">Your Meals</h3>
    <div className="max-h-[60vh] overflow-y-auto">
      {isLoading ? (
        // Show loading skeletons
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <MealSkeleton key={index} />
          ))}
        </div>
      ) : filteredMeals.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No meals added yet
        </p>
      ) : (
        <>
          {/* Search Bar - Sticky */}
          <div className="sticky top-0 z-10 bg-background pb-2">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>

          {/* Meal List */}
          <div className="space-y-2">
            {filteredMeals.map((meal) => (
              <Card key={meal.id}>
                {/* Meal card */}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-medium ${meal.meal_type === 'standalone' ? 'text-yellow-500' : ''}`}>{meal.name}</h4>
                      {(meal?.ingredients?.length > 0) && (
                        meal.meal_type === 'composed' ? (
                          <>
                            <IngredientsSummaryText meal={meal} />
                            <MacroSummaryText data={meal} />
                          </>
                        ) : (
                          <MacroSummaryText data={meal} />
                        )
                      )}
                      {(meal?.ingredients?.length === 0 && meal.meal_type === 'composed') && (
                        <p className="text-sm text-muted-foreground">
                          No ingredients
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(meal)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                                                <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(meal.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
  );
};

export default RightColumnEdit;