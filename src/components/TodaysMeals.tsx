
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TodaysMeals = ({ meals, onRemoveMeal }) => {
  if (meals.length === 0) {
    return (
      <Card className="mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            Today's Meals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <p className="text-sm sm:text-base">No meals logged today yet.</p>
            <p className="text-xs sm:text-sm">Start by logging your first meal!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          Today's Meals ({meals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {meals.map((meal) => (
            <Card key={meal.id} className="bg-gradient-to-r from-white to-emerald-50 border-emerald-100">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-sm sm:text-base">{meal.name}</h3>
                      <span className="text-xs sm:text-sm text-muted-foreground bg-white px-2 py-1 rounded w-fit">
                        {meal.timestamp}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                      {meal.ingredients.join(", ")}
                    </p>
                    <div className="flex gap-3 sm:gap-4 text-xs text-muted-foreground">
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fat}g</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2">
                    <div className="text-center sm:text-right">
                      <div className="text-lg sm:text-xl font-bold text-emerald-600">
                        {meal.calories}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">calories</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMeal(meal.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMeals;
