
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TodaysMeals = ({ meals, onRemoveMeal }) => {
  if (meals.length === 0) {
    return (
      <Card className="mb-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Today's Meals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No meals logged today yet.</p>
            <p className="text-sm">Start by logging your first meal!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          Today's Meals ({meals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {meals.map((meal) => (
            <Card key={meal.id} className="bg-gradient-to-r from-white to-emerald-50 border-emerald-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{meal.name}</h3>
                      <span className="text-sm text-muted-foreground bg-white px-2 py-1 rounded">
                        {meal.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {meal.ingredients.join(", ")}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fat}g</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="text-xl font-bold text-emerald-600">
                        {meal.calories}
                      </div>
                      <div className="text-sm text-muted-foreground">calories</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMeal(meal.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
