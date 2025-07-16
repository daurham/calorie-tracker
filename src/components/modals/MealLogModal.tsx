import { useState } from "react";
import { useToast } from "@/hooks";
import {
  Button,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Card, 
  CardContent,
  SearchBar,
} from "@/components/ui";
import { Meal } from "@/types";
import MacroSummaryText from "../MacroSummaryText";
import IngredientsSummaryText from "../IngredientsSummaryText";

interface MealLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeal: (meal: Meal) => void;
  meals: Meal[];
}

const MealLogDialog = ({ open, onOpenChange, onAddMeal, meals }: MealLogDialogProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.ingredients.some(ingredient => 
      ingredient.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
    )
  );

  const handleAddMeal = (meal: Meal) => {
    onAddMeal(meal);
    toast({
      title: "Meal logged!",
      description: `${meal.name} (${meal.calories} cal) added to today's meals.`,
    });
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Log a Meal
          </DialogTitle>
          <DialogDescription>
            Search and select from your saved meal combos to add to today's log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search meals</Label>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Search by name or ingredients.." />

          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredMeals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "No meals found matching your search." : "No meal combos available."}
              </p>
            ) : (
              filteredMeals.map((meal) => (
                <Card key={meal.id} className="hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{meal.name}</h3>
                        <div className="text-sm text-muted-foreground mb-2">
                          {meal.meal_type === 'composed' &&
                            <IngredientsSummaryText meal={meal} />
                          }
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <MacroSummaryText data={meal} />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                          {meal.calories}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">calories</div>
                        <Button 
                          onClick={() => handleAddMeal(meal)}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          Add to Log
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealLogDialog;
