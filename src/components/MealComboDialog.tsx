import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { 
  Button, 
  Input, 
  Label, 
  Textarea, 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  Card, 
  CardContent,
} from "@/components/ui";

const MealComboDialog = ({ open, onOpenChange, onAddMealCombo, availableIngredients }) => {
  const [comboName, setComboName] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [notes, setNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const { toast } = useToast();

  const addIngredient = (ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 1 }]);
    }
  };

  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== ingredientId));
  };

  const updateQuantity = (ingredientId, quantity) => {
    setSelectedIngredients(selectedIngredients.map(i => 
      i.id === ingredientId ? { ...i, quantity: Math.max(0.1, quantity) } : i
    ));
  };

  const calculateTotals = () => {
    return selectedIngredients.reduce((totals, ingredient) => {
      const multiplier = ingredient.quantity;
      return {
        calories: totals.calories + (ingredient.calories * multiplier),
        protein: totals.protein + (ingredient.protein * multiplier),
        carbs: totals.carbs + (ingredient.carbs * multiplier),
        fat: totals.fat + (ingredient.fat * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSave = () => {
    if (!comboName || selectedIngredients.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add a name and at least one ingredient.",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    const newCombo = {
      name: comboName,
      ingredients: selectedIngredients.map(ing => ({
        id: ing.id,
        quantity: ing.quantity
      })),
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      notes,
      instructions
    };

    onAddMealCombo(newCombo);

    toast({
      title: "Meal combo created!",
      description: `${comboName} has been saved to your meal combos.`,
    });

    // Reset form
    setComboName("");
    setSelectedIngredients([]);
    setNotes("");
    setInstructions("");
    onOpenChange(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedIngredients([]);
      setComboName("");
      setNotes("");
      setInstructions("");
    }
    onOpenChange(open);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Create Meal Combo
          </DialogTitle>
          <DialogDescription>
            Combine ingredients to create a reusable meal combo for quick logging.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="combo-name">Combo Name</Label>
              <Input
                id="combo-name"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                placeholder="e.g., Protein Power Bowl"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Available Ingredients</Label>
              <div className="grid gap-2 mt-2 max-h-48 overflow-y-auto">
                {availableIngredients.map((ingredient) => (
                  <Card 
                    key={ingredient.id} 
                    className="cursor-pointer hover:bg-emerald-50 bg-emerald-50 dark:hover:bg-emerald-950 dark:bg-emerald-900 transition-all duration-200 active:scale-95 active:bg-emerald-100 dark:active:bg-emerald-800"
                    onClick={() => addIngredient(ingredient)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{ingredient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ingredient.calories} cal per {ingredient.unit}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this combo..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions (optional)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Preparation instructions..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Right Column - Selected Ingredients & Totals */}
          <div className="space-y-6">
            <div>
              <Label>Selected Ingredients</Label>
              <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                {selectedIngredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No ingredients selected yet
                  </p>
                ) : (
                  selectedIngredients.map((ingredient) => (
                    <Card key={ingredient.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{ingredient.name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(ingredient.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={ingredient.quantity}
                            onChange={(e) => updateQuantity(ingredient.id, parseFloat(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            {ingredient.unit}
                          </span>
                          <span className="text-sm font-medium ml-auto">
                            {Math.round(ingredient.calories * ingredient.quantity)} cal
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Nutritional Summary */}
            {selectedIngredients.length > 0 && (
              <Card className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Nutritional Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
                      <div className="text-sm opacity-90">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{Math.round(totals.protein)}g</div>
                      <div className="text-sm opacity-90">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{Math.round(totals.carbs)}g</div>
                      <div className="text-sm opacity-90">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{Math.round(totals.fat)}g</div>
                      <div className="text-sm opacity-90">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
            Save Combo
          </Button>
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealComboDialog;
