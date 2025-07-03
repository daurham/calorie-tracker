import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
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
} from "@/components/ui";
import BarcodeScanner from "./BarcodeScanner";
import { useIsMobile } from "@/hooks/use-mobile";
import ModalScanner from "./ModalScanner";
import { fetchData } from "@/hooks/useTestFetch";

const IngredientsManagementDialog = ({ 
  open, 
  onOpenChange, 
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [barcode, setBarcode] = useState("");
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    unit: ""
  });
  const [showScanner, setShowScanner] = useState(false);
  const [productData, setProductData] = useState(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const resetForm = () => {
    console.log("resetForm");
    setFormData({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      unit: ""
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.calories || !formData.unit) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const ingredientData = {
      ...formData,
      calories: parseInt(formData.calories),
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fat: parseFloat(formData.fat) || 0
    };

    try {
      if (editingId) {
        await onUpdateIngredient({ ...ingredientData, id: editingId });
        toast({
          title: "Ingredient updated!",
          description: `${formData.name} has been updated.`,
        });
      } else {
        await onAddIngredient(ingredientData);
        toast({
          title: "Ingredient added!",
          description: `${formData.name} has been added to your ingredients.`,
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ingredient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ingredient) => {
    setEditingId(ingredient.id);
    setFormData({
      name: ingredient.name,
      calories: ingredient.calories.toString(),
      protein: ingredient.protein.toString(),
      carbs: ingredient.carbs.toString(),
      fat: ingredient.fat.toString(),
      unit: ingredient.unit
    });
    setIsAdding(true);
  };

  const handleDelete = async (ingredient) => {
    try {
      await onDeleteIngredient(ingredient.id);
      toast({
        title: "Ingredient deleted!",
        description: `${ingredient.name} has been removed.`,
      });
    } catch (error) {
      // Check if it's the specific error about ingredient being in use
      console.log("error", error);
      if (error.status === 409) {
        const errorData = error.data;
        toast({
          title: "Cannot delete ingredient",
          description: errorData.message,
          variant: "destructive",
        });
        
        // Show additional suggestions in a separate toast
        if (errorData.suggestions) {
          setTimeout(() => {
            toast({
              title: "Suggestions",
              description: (
                <ul className="list-disc list-inside space-y-1">
                  {errorData.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              ),
              variant: "default",
            });
          }, 3000);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to delete ingredient. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDetected = (product) => {
    console.log("Product data:", product);
    setProductData(product);
    setShowScanner(false);
    // Here you can also populate your form automatically.
    setFormData({
      name: `${product.product_name} (${product.brands})`,
      calories: product.nutriments["energy-kcal_serving"],
      protein: product.nutriments.proteins_serving,
      carbs: product.nutriments.carbohydrates_serving,
      fat: product.nutriments.fat_serving,
      unit: product.serving_size
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Manage Ingredients
          </DialogTitle>
          <DialogDescription>
            Add, edit, or remove ingredients from your database.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingId ? "Edit Ingredient" : "Add New Ingredient"}
              </h3>
              {isAdding && (
                <Button variant="ghost" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isAdding ? (
              <div>
                {isMobile &&
                  (<div>
                    <Button onClick={() => setShowScanner(true)} className="bg-emerald-500 text-black hover:bg-emerald-600" variant="outline">
                      Scan Barcode
                    </Button>

                    <Button onClick={() => fetchData(handleDetected)}>Test Fetch</Button> 

                    {showScanner && (
                      <ModalScanner
                        onDetected={handleDetected}
                        onClose={() => setShowScanner(false)}
                      />
                    )}
                  </div> 
                )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken Breast"
                  />
                </div>

                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                    placeholder="e.g., 165"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                      placeholder="e.g., 31"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      step="0.1"
                      value={formData.carbs}
                      onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                      placeholder="e.g., 0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      value={formData.fat}
                      onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))}
                      placeholder="e.g., 3.6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g., 100g"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    {editingId ? "Update" : "Add"} Ingredient
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
              </div>
            ) : (
              <Button onClick={() => setIsAdding(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Ingredient
              </Button>
            )}
          </div>

          {/* Right Column - Ingredients List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Ingredients</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {ingredients.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No ingredients added yet
                </p>
              ) : (
                ingredients.map((ingredient) => (
                  <Card key={ingredient.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{ingredient.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ingredient.calories} cal per {ingredient.unit}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>P: {ingredient.protein}g</span>
                            <span>C: {ingredient.carbs}g</span>
                            <span>F: {ingredient.fat}g</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ingredient)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ingredient)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IngredientsManagementDialog; 