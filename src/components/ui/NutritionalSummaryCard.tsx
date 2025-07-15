import { Card, CardContent } from ".";

const NutritionalSummaryCard = ({ totals }) => {
  return (
    <Card className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Nutritional Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(totals.calories || 0)}</div>
            <div className="text-sm opacity-90">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{Math.round(totals.protein || 0)}g</div>
            <div className="text-sm opacity-90">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{Math.round(totals.carbs || 0)}g</div>
            <div className="text-sm opacity-90">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{Math.round(totals.fat || 0)}g</div>
            <div className="text-sm opacity-90">Fat</div>
          </div>
        </div>
      </CardContent>
    </Card>);
};

export default NutritionalSummaryCard;