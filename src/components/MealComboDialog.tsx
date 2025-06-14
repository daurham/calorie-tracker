import { useState, useEffect } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { availableIngredients } from "@/data/sampleData";
import { useToast } from "@/hooks/use-toast";
import AddIngredientDialog from "./AddIngredientDialog";
import { addIngredient, getIngredients, addMealCombo, updateMealCombo } from "@/lib/api-client";
// import { Ingredient, getIngredients, addIngredient, updateIngredient, deleteIngredient } from '@/lib/api-client;
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Ingredient {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
}

interface MealCombo {
  id: number;
  name: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  instructions?: string;
}

interface MealComboDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  editingCombo?: MealCombo;
}

const MealComboDialog = ({ open, onOpenChange, onSave, editingCombo }: MealComboDialogProps) => {
  const [comboName, setComboName] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [notes, setNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [customIngredients, setCustomIngredients] = useState<Ingredient[]>([]);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    unit: "g"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const allIngredients = [...availableIngredients, ...customIngredients];
  const orderedIngredients = allIngredients.sort((a, b) => a.name.localeCompare(b.name));
  const filteredIngredients = orderedIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load ingredients when dialog opens
  useEffect(() => {
    if (open) {
      loadIngredients();
    }
  }, [open]);

  // Handle editing combo changes
  useEffect(() => {
    if (open && editingCombo && customIngredients.length > 0) {
      setComboName(editingCombo.name);
      setNotes(editingCombo.notes || "");
      setInstructions(editingCombo.instructions || "");
      
      // Convert ingredients to selected format
      const ingredients = editingCombo.ingredients.map(name => {
        const ingredient = customIngredients.find(i => i.name === name);
        if (ingredient) {
          return { ...ingredient, quantity: 1 };
        }
        return null;
      }).filter(Boolean);
      
      setSelectedIngredients(ingredients);
    } else if (!editingCombo) {
      resetForm();
    }
  }, [open, editingCombo, customIngredients]);

  const loadIngredients = async () => {
    try {
      const ingredients = await getIngredients();
      setCustomIngredients(ingredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const resetForm = () => {
    setComboName("");
    setSelectedIngredients([]);
    setNotes("");
    setInstructions("");
    setSearchQuery("");
  };

  const handleAddIngredient = async (formData: { name: string; calories: number; protein: number; carbs: number; fat: number; unit: string }) => {
    try {
      setIsLoading(true);
      const ingredient: Ingredient = await addIngredient(formData);
      setCustomIngredients((prev: Ingredient[]) => [...prev, ingredient]);
      setNewIngredient({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        unit: "g"
      });
      setIsAddIngredientOpen(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredientToCombo = (ingredient: Ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 1 }]);
    }
  };

  const removeIngredient = (ingredientId: number) => {
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

  const handleSave = async () => {
    if (!comboName || selectedIngredients.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add a name and at least one ingredient.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const totals = calculateTotals();
      
      const comboData = {
        name: comboName,
        ingredients: selectedIngredients.map(i => i.name),
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        notes: notes || undefined,
        instructions: instructions || undefined
      };

      if (editingCombo) {
        await updateMealCombo({ ...comboData, id: editingCombo.id });
        toast({
          title: "Meal combo updated!",
          description: `${comboName} has been updated.`,
        });
      } else {
        await addMealCombo(comboData);
        toast({
          title: "Meal combo created!",
          description: `${comboName} has been saved to your meal combos.`,
        });
      }

      resetForm();
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving meal combo:', error);
      toast({
        title: "Error",
        description: "Failed to save meal combo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              {editingCombo ? 'Edit Meal Combo' : 'Create Meal Combo'}
            </DialogTitle>
            <DialogDescription>
              {editingCombo ? 'Modify your existing meal combo.' : 'Combine ingredients to create a reusable meal combo for quick logging.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2 flex-1 overflow-hidden">
            {/* Left Column - Form */}
            <div className="space-y-6 overflow-y-auto pr-2">
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
                <div className="flex items-center justify-between mb-2">
                  <Label>Available Ingredients</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddIngredientOpen(true)}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <div className="grid gap-2 mt-2 max-h-[300px] overflow-y-auto">
                  {filteredIngredients.map((ingredient) => (
                    <Card 
                      key={ingredient.id} 
                      className="bg-emerald-50 cursor-pointer hover:bg-emerald-50 transition-colors"
                      onClick={() => addIngredientToCombo(ingredient)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{ingredient.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ingredient.calories} cal per {ingredient.unit}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-emerald-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-md">
                    <Label className="cursor-pointer">Notes (optional)</Label>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this combo..."
                    className="mt-1"
                  />
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-md">
                    <Label className="cursor-pointer">Instructions (optional)</Label>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isInstructionsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Preparation instructions..."
                    className="mt-1"
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Right Column - Selected Ingredients & Totals */}
            <div className="space-y-6 overflow-y-auto pr-2">
              <div>
                <Label>Selected Ingredients</Label>
                <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
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

          <div className="flex gap-2 pt-4 mt-auto">
            <Button 
              onClick={handleSave} 
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : editingCombo ? "Update Combo" : "Save Combo"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddIngredientDialog
        open={isAddIngredientOpen}
        onOpenChange={setIsAddIngredientOpen}
        onAddIngredient={handleAddIngredient}
      />
    </>
  );
};

export default MealComboDialog;