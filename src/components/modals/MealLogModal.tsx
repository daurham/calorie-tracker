import { useState } from "react";
import { Search } from "lucide-react";
import { useToast } from "@/hooks";
import {
  Button,
  Input,
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
import { MealCombo } from "@/types";

interface MealLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeal: (meal: MealCombo) => void;
  mealCombos: MealCombo[];
}

const MealLogDialog = ({ open, onOpenChange, onAddMeal, mealCombos }: MealLogDialogProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMeals = mealCombos.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.ingredients.some(ingredient => 
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleAddMeal = (meal) => {
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
            {/* <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ingredient..."
                className="pl-10"
              />
            </div> */}
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
                        <p className="text-sm text-muted-foreground mb-2">
                          {meal.ingredients.map(i => i.name).join(", ")}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Protein: {meal.protein}g</span>
                          <span>Carbs: {meal.carbs}g</span>
                          <span>Fat: {meal.fat}g</span>
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
