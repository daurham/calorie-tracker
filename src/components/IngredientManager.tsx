import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ingredient } from '@/lib/api-client';
import { getIngredientsData, addIngredientData, updateIngredientData, deleteIngredientData } from '@/lib/data-source';

interface IngredientFormData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
}

export default function IngredientManager() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    unit: '100g'
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      setIsLoading(true);
      const data = await getIngredientsData();
      setIngredients(data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIngredient) {
        const updated = await updateIngredientData({ ...editingIngredient, ...formData });
        setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const newIngredient = await addIngredientData(formData);
        setIngredients(prev => [...prev, newIngredient]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      unit: ingredient.unit
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await deleteIngredientData(id);
        setIngredients(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Error deleting ingredient:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      unit: '100g'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ingredients</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={e => setFormData(prev => ({ ...prev, calories: Number(e.target.value) }))}
                  required
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
                    onChange={e => setFormData(prev => ({ ...prev, protein: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={formData.carbs}
                    onChange={e => setFormData(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    value={formData.fat}
                    onChange={e => setFormData(prev => ({ ...prev, fat: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingIngredient ? 'Update' : 'Add'} Ingredient
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading ingredients...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{ingredient.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Calories:</span>
                    <span className="font-medium">{ingredient.calories}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Protein:</span>
                    <span className="font-medium">{ingredient.protein}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Carbs:</span>
                    <span className="font-medium">{ingredient.carbs}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fat:</span>
                    <span className="font-medium">{ingredient.fat}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Unit:</span>
                    <span className="font-medium">{ingredient.unit}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ingredient)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ingredient.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 