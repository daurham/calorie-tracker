import React, { useState, useEffect } from 'react';
import { analyzeFoodDescription } from '@/lib/ai/secureFoodRecognition';
import { isAIAuthenticated, authenticateAI } from '@/lib/ai/auth';
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

interface AIFoodRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateMeal: (meal: any) => void;
}

export const AIFoodRecognitionModal: React.FC<AIFoodRecognitionModalProps> = ({
  isOpen,
  onClose,
  onGenerateMeal
}) => {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [portion, setPortion] = useState(1);
  const [showAuth, setShowAuth] = useState(!isAIAuthenticated());
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodDescription(description);
      setAnalysisResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
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
    if (!analysisResult) return;
    
    const meal = {
      id: `ai-food-${Date.now()}`,
      name: analysisResult.name,
      meal_type: 'mod',
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fat: analysisResult.fat,
      notes: `AI recognized: ${description}`,
      instructions: 'This meal was created using AI food recognition.',
      ingredients: [], // AI meals don't have ingredients
      modId: 'ai-food-recognition',
      portion: portion,
      modData: {
        description,
        name: analysisResult.name,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        portion
      }
    };
    
    onGenerateMeal(meal);
    onClose();
  };

  const updateMacros = (field: string, value: number) => {
    setAnalysisResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (showAuth) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>AI Food Analyzer</DialogTitle>
          <DialogDescription>
            Enter the passcode to unlock AI-powered food analysis features.
          </DialogDescription>
        </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Features Locked</h3>
            <p className="text-sm text-gray-500 mb-6">
              Enter the passcode to unlock AI-powered food analysis features.
            </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
              />
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAuth}
              >
                Unlock AI Features
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Food Analyzer</DialogTitle>
          <DialogDescription>
            Describe what you ate and let AI estimate the nutritional information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">What did you eat?</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="Describe your meal in detail..."
              rows={3}
            />
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!description.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </div>
            ) : (
              'Analyze with AI'
            )}
          </Button>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">AI Analysis Complete</h4>
                <p className="text-sm text-green-700">{analysisResult.description}</p>
              </div>

              {/* Editable Macro Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foodName">Food Name</Label>
                  <Input
                    id="foodName"
                    type="text"
                    value={analysisResult.name}
                    onChange={(e) => setAnalysisResult(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portion">Portion Size</Label>
                  <Input
                    id="portion"
                    type="number"
                    value={portion}
                    onChange={(e) => setPortion(Number(e.target.value))}
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={analysisResult.calories}
                    onChange={(e) => updateMacros('calories', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={analysisResult.protein}
                    onChange={(e) => updateMacros('protein', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={analysisResult.carbs}
                    onChange={(e) => updateMacros('carbs', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={analysisResult.fat}
                    onChange={(e) => updateMacros('fat', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                className="w-full"
              >
                Add to Today's Meals
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
