import { useState, useEffect, useRef } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { useToast, useIsMobile } from "@/hooks";
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardContent,
  Skeleton,
  SearchBar,
} from "@/components/ui";
import { ScannerModal, DataManagementModal, AlertModal } from "@/components/modals";
import { Ingredient } from "@/types";

interface IngredientManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Ingredient) => void;
  onUpdateIngredient: (ingredient: Ingredient) => void;
  onDeleteIngredient: (id: number) => void;
  isLoading?: boolean;
}

const IngredientsManagementModal = ({ 
  open, 
  onOpenChange, 
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  isLoading = false
}: IngredientManagementModalProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    unit: "",
    is_staple: false
  });
  const [showScanner, setShowScanner] = useState(false);
  const [productData, setProductData] = useState(null);
  const [deleteIngredientId, setDeleteIngredientId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const scrollPositionRef = useRef(0);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const filteredIngredients = ingredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // useEffect(() => {
  //   console.log("filteredIngredients", filteredIngredients);
  // }, [filteredIngredients]);

  // onMount logger
  // useEffect(() => {
  //   console.log("IngredientManagementModal mounted");
  // }, []);

  // Restore scroll position after ingredients update
  useEffect(() => {
    if (modalContentRef.current && scrollPositionRef.current > 0) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = scrollPositionRef.current;
        }
      }, 0);
    }
  }, [ingredients]);

  const resetForm = () => {
    // console.log("resetting form from resetForm");
    setFormData({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      unit: "",
      is_staple: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent, addAsNew: boolean = false) => {
    e.preventDefault();
    if (editingId === null) {
      addAsNew = true;
    }
    
    // Save current scroll position before update
    if (modalContentRef.current) {
      scrollPositionRef.current = modalContentRef.current.scrollTop;
    }
    
    // Validate form
    if(ingredients.find(ingredient => ingredient.name === formData.name) && addAsNew === true) {
      toast({
        title: "Ingredient already exists",
        description: "Please choose a different name.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.name || !formData.calories || !formData.unit) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    // Check if nothings changed
    if(addAsNew === false) {
      const ingredient = ingredients.find(ingredient => ingredient.name === formData.name);
      if(
        ingredient &&
        ingredient.calories == parseInt(formData.calories) &&
        ingredient.protein == parseFloat(formData.protein) &&
        ingredient.carbs == parseFloat(formData.carbs) &&
        ingredient.fat == parseFloat(formData.fat) &&
        ingredient.unit === formData.unit &&
        ingredient.is_staple === formData.is_staple
      ) {
        toast({
          title: "Nothing changed",
          description: "Please change something to update the ingredient.",
          variant: "destructive",
        });
        return;
      }
    }
    
    const ingredientData = {
      ...formData,
      calories: parseInt(formData.calories),
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fat: parseFloat(formData.fat) || 0,
      is_staple: formData.is_staple
    };

    try {
      if (addAsNew === false) {
        // console.log("updating ingredient", ingredientData);
        await onUpdateIngredient({ ...ingredientData, id: editingId } as Ingredient);
        toast({
          title: "Ingredient updated!",
          description: `${formData.name} has been updated.`,
        });
      } else {
        // console.log("adding ingredient", ingredientData);
        await onAddIngredient(ingredientData as Ingredient);
        toast({
          title: "Ingredient added!",
          description: `${formData.name} has been added to your ingredients.`,
        });
      }
      if (addAsNew === true) {
        console.log("resetting form from handleSubmit");
        resetForm();
      }
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
      unit: ingredient.unit,
      is_staple: ingredient.is_staple || false
    });
    setIsAdding(true);
  };

  const handleDeleteClick = (ingredient) => {
    setDeleteIngredientId(ingredient.id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteIngredientId) return;
    
    try {
      await onDeleteIngredient(deleteIngredientId);
      toast({
        title: "Ingredient deleted!",
        description: "The ingredient has been removed successfully.",
      });
      resetForm();
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
    } finally {
      setShowDeleteDialog(false);
      setDeleteIngredientId(null);
    }
  };

  const handleDetected = (product) => {
    // console.log("Product data:", product);
    setProductData(product);
    setShowScanner(false);
    // Here you can also populate your form automatically.
    setFormData({
      name: `${product.product_name} (${product.brands})`,
      calories: product.nutriments["energy-kcal_serving"],
      protein: product.nutriments.proteins_serving,
      carbs: product.nutriments.carbohydrates_serving,
      fat: product.nutriments.fat_serving,
      unit: product.serving_size,
      is_staple: false
    });
  };

  const DesktopStyling = "max-h-[60vh] overflow-y-auto";

  // Shows add / edit form
  const leftColumn = (
    <div className={`space-y-6 ${ !isMobile && DesktopStyling}`}>
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
        {(isMobile && editingId === null) &&
          (<div className="flex justify-center">
            <Button onClick={() => setShowScanner(true)} className="bg-emerald-500 text-black hover:bg-emerald-600" variant="outline">
              Barcode Lookup
            </Button>

            {showScanner && (
              <ScannerModal
                onDetected={handleDetected}
                onClose={() => setShowScanner(false)}
              />
            )}
          </div> 
        )}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Chicken Breast"
            disabled={isLoading}
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
            disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_staple"
            checked={formData.is_staple}
            onChange={(e) => setFormData(prev => ({ ...prev, is_staple: e.target.checked }))}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <Label htmlFor="is_staple" className="text-sm font-normal">
            Common household staple
          </Label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={isLoading}>
            {editingId ? "Update" : "Add"}
          </Button>
          {editingId && (
            <Button type="button" className="bg-blue-500 hover:bg-blue-600"
              onClick={(e) => handleSubmit(e, true)} disabled={isLoading}>
              Add as New
            </Button>
          )}
          <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
      </div>
    ) : (
      <Button onClick={() => setIsAdding(true)} className="w-full" disabled={isLoading}>
        <Plus className="h-4 w-4 mr-2" />
        Add New Ingredient
      </Button>
    )}
  </div>
  )

  // Loading skeleton for ingredients
  const IngredientSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Shows ingredients list
  const rightColumn = (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Ingredients</h3>
            <div ref={modalContentRef} className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                // Show loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <IngredientSkeleton key={index} />
                ))
              ) : filteredIngredients.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No ingredients added yet
                </p>
              ) : (
                <>
                {/* Search Bar - Sticky */}
                <div className="sticky top-0 z-10 bg-background pb-2">
                  <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </div>

                {/* Ingredients List */}
                <div className="space-y-2">
                {filteredIngredients.map((ingredient) => (
                  <Card key={ingredient.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{ingredient.name}</h4>
                            {ingredient.is_staple && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                Staple
                              </span>
                            )}
                          </div>
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
                            disabled={isLoading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(ingredient)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={isLoading}
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
  )

  return (
    <>
      <DataManagementModal
        open={open}
        onOpenChange={(val) => {
          onOpenChange(val)
          setTimeout(() => resetForm(), 500)
        }}
        title="Manage Ingredients"
        description="Add, edit, or remove ingredients from your database."
        leftColumn={leftColumn}
        rightColumn={rightColumn}
      />
      
      <AlertModal
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteConfirm={handleDeleteConfirm}
        title="Delete Ingredient"
        description="Are you sure you want to delete this ingredient? This action cannot be undone."
      />
    </>
  );
};

export default IngredientsManagementModal;