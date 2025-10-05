import React, { useState } from 'react';
import { analyzeFoodDescription } from '@/lib/ai/secureFoodRecognition';
import { isAIAuthenticated, authenticateAI } from '@/lib/ai/auth';
import { useToast } from '@/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Bot, Loader2 } from 'lucide-react';

interface AIMealCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealDetected: (meal: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

export const AIMealCreatorModal: React.FC<AIMealCreatorModalProps> = ({
  isOpen,
  onClose,
  onMealDetected
}) => {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(!isAIAuthenticated());
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the meal you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodDescription(description);
      setAnalysisResult(result);
      setEditedResult({ ...result });
      setIsEditing(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze meal description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAuth = () => {
    if (authenticateAI(passcode)) {
      setShowAuth(false);
      setAuthError('');
    } else {
      setAuthError('Invalid passcode');
    }
  };

  const handleSubmit = () => {
    if (!editedResult) return;

    onMealDetected({
      name: editedResult.name,
      calories: editedResult.calories,
      protein: editedResult.protein,
      carbs: editedResult.carbs,
      fat: editedResult.fat,
    });

    // Reset form
    setDescription('');
    setAnalysisResult(null);
    setEditedResult(null);
    setIsEditing(false);
    onClose();

    toast({
      title: "Meal created",
      description: `${editedResult.name} has been added to the form.`,
    });
  };

  const handleClose = () => {
    // Clear all form state
    setDescription('');
    setAnalysisResult(null);
    setEditedResult(null);
    setIsEditing(false);
    onClose();
  };

  // Clear form when modal is closed externally
  React.useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setAnalysisResult(null);
      setEditedResult(null);
      setIsEditing(false);
    }
  }, [isOpen]);

  const updateMacros = (field: string, value: number) => {
    setEditedResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (showAuth) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Authentication Required
            </DialogTitle>
            <DialogDescription>
              Please enter your AI passcode to use the meal creator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter your AI passcode"
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
              {authError && (
                <p className="text-sm text-red-600 mt-1">{authError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAuth} className="flex-1">
                Authenticate
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Meal Creator
          </DialogTitle>
          <DialogDescription>
            Describe the meal you want to create. This will be a standalone meal with nutritional information generated by AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Meal Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Grilled salmon with quinoa and roasted vegetables"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !description.trim()}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Create Meal with AI
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">AI Analysis Complete</h4>
                <p className="text-sm text-green-700">{analysisResult?.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mealName">Meal Name</Label>
                  <Input
                    id="mealName"
                    type="text"
                    value={editedResult?.name || ''}
                    onChange={(e) => setEditedResult(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={editedResult?.calories || 0}
                    onChange={(e) => updateMacros('calories', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={editedResult?.protein || 0}
                    onChange={(e) => updateMacros('protein', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={editedResult?.carbs || 0}
                    onChange={(e) => updateMacros('carbs', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={editedResult?.fat || 0}
                    onChange={(e) => updateMacros('fat', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  Add to Form
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setAnalysisResult(null);
                  setEditedResult(null);
                }}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
