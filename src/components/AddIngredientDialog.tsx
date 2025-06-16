import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AddIngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddIngredient: (ingredient: any) => void;
}

const AddIngredientDialog = ({ open, onOpenChange, onAddIngredient }: AddIngredientDialogProps) => {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [unit, setUnit] = useState("100g");
  const { toast } = useToast();

  const handleSave = () => {
    if (!name || !calories) {
      toast({
        title: "Missing information",
        description: "Please provide at least a name and calories.",
        variant: "destructive",
      });
      return;
    }

    const newIngredient = {
      id: Date.now(),
      name,
      calories: Math.round(calories || 0),
      protein: Math.round(protein || 0),
      carbs: Math.round(carbs || 0),
      fat: Math.round(fat || 0),
      unit
    };

    onAddIngredient(newIngredient);
    
    toast({
      title: "Ingredient added!",
      description: `${name} has been added to your ingredients.`,
    });

    // Reset form
    setName("");
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setUnit("100g");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Add Custom Ingredient
          </DialogTitle>
          <DialogDescription>
            Create a custom ingredient with nutritional information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ingredient-name">Name *</Label>
            <Input
              id="ingredient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Quinoa"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calories *</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Per unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="100g"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddIngredientDialog;
