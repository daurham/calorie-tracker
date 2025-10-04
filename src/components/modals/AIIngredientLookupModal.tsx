import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, X } from 'lucide-react';
import { analyzeIngredientDescription } from '@/lib/ai/secureIngredientRecognition';
import { useToast } from '@/hooks';

interface AIIngredientLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientDetected: (ingredient: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    unit: string;
    is_staple: boolean;
  }) => void;
}

export const AIIngredientLookupModal: React.FC<AIIngredientLookupModalProps> = ({
  isOpen,
  onClose,
  onIngredientDetected
}) => {
  const [description, setDescription] = useState('');
  const [servingType, setServingType] = useState<'serving' | 'whole'>('serving');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the ingredient you want to add.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeIngredientDescription(description, servingType);
      setAnalysisResult(result);
      setEditedResult({ ...result });
      setIsEditing(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze ingredient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!editedResult) return;

    onIngredientDetected({
      name: editedResult.name,
      calories: editedResult.calories,
      protein: editedResult.protein,
      carbs: editedResult.carbs,
      fat: editedResult.fat,
      unit: editedResult.unit,
      is_staple: false
    });

    // Reset form
    setDescription('');
    setAnalysisResult(null);
    setEditedResult(null);
    setIsEditing(false);
    onClose();

    toast({
      title: "Ingredient added",
      description: `${editedResult.name} has been added to the form.`,
    });
  };

  const handleClose = () => {
    setDescription('');
    setAnalysisResult(null);
    setEditedResult(null);
    setIsEditing(false);
    onClose();
  };

  const updateEditedField = (field: string, value: any) => {
    setEditedResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Ingredient Lookup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isEditing ? (
            /* Input Phase */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Describe the ingredient</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., red bell pepper, medium-sized apple, boneless chicken breast, 1 cup of cooked rice..."
                  className="min-h-[100px]"
                  disabled={isAnalyzing}
                />
                <p className="text-sm text-muted-foreground">
                  Describe what ingredient you want to add. Be as specific as possible for better results.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Serving Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="serving"
                      checked={servingType === 'serving'}
                      onChange={(e) => setServingType(e.target.value as 'serving')}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Serving size (e.g., 1 medium, 1 cup)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="whole"
                      checked={servingType === 'whole'}
                      onChange={(e) => setServingType(e.target.value as 'whole')}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Whole item (e.g., entire apple, whole chicken breast)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !description.trim()}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Ingredient
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Results Phase */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Analysis Results</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {analysisResult && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Confidence: {Math.round(analysisResult.confidence * 100)}% • {analysisResult.description}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editedResult.name}
                        onChange={(e) => updateEditedField('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={editedResult.unit}
                        onChange={(e) => updateEditedField('unit', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={editedResult.calories}
                        onChange={(e) => updateEditedField('calories', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        step="0.1"
                        value={editedResult.protein}
                        onChange={(e) => updateEditedField('protein', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carbs">Carbs (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        step="0.1"
                        value={editedResult.carbs}
                        onChange={(e) => updateEditedField('carbs', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fat">Fat (g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        step="0.1"
                        value={editedResult.fat}
                        onChange={(e) => updateEditedField('fat', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  Add to Form
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
