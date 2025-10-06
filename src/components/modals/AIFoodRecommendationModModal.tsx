import { useState, useEffect } from 'react';
import { Sparkles, Bot, Target, Clock, ChefHat, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress, Input, Label } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';
import BaseModModal from './BaseModModal';
import { isAIAuthenticated, authenticateAI } from '@/lib/ai/auth';
import { useToast } from '@/hooks';

interface MealRecommendation {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  reasoning: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  instructions: string[];
}

interface AIFoodRecommendationModModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
  availableIngredients?: any[];
  availableMeals?: any[];
  currentMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remainingMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const AIFoodRecommendationModModal = ({
  open,
  onOpenChange,
  mod,
  onMealGenerated,
  availableIngredients,
  availableMeals,
  currentMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 },
  remainingMacros = { calories: 2000, protein: 150, carbs: 200, fat: 80 }
}: AIFoodRecommendationModModalProps) => {
  const [showAuth, setShowAuth] = useState(!isAIAuthenticated());
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([]);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [portion, setPortion] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();

  // Initialize inputs with default values
  useEffect(() => {
    if (open && mod) {
      const defaultInputs: Record<string, any> = {};
      mod.inputs.forEach(input => {
        if (input.defaultValue !== undefined) {
          defaultInputs[input.key] = input.defaultValue;
        }
      });
      setInputs(defaultInputs);
    }
  }, [open, mod]);


  const handleAuth = async () => {
    try {
      const success = await authenticateAI(passcode);
      if (success) {
        setShowAuth(false);
        setAuthError('');
      } else {
        setAuthError('Invalid passcode');
      }
    } catch (error) {
      setAuthError('Authentication failed');
    }
  };

  const handleGetRecommendations = async () => {
    if (!inputs.cravingTypes || inputs.cravingTypes.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one craving type.",
        variant: "destructive",
      });
      return;
    }

    if (inputs.dataSource !== 'any' && (availableIngredients.length === 0 || availableMeals.length === 0)) {
      toast({
        title: "No Data Available",
        description: "No ingredients or meals available for recommendation.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Show a more informative loading message for complex requests
    if (inputs.dataSource === 'all' && (availableIngredients.length > 20 || availableMeals.length > 20)) {
      toast({
        title: "Processing Complex Request",
        description: "Analyzing your ingredients and meals. This may take up to 90 seconds...",
        variant: "default",
      });
    }
    
    try {
      const response = await fetch('/api/ai-recommend-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cravingTypes: inputs.cravingTypes,
          dataSource: inputs.dataSource,
          preferences: inputs.preferences || '',
          timeOfDay: inputs.timeOfDay,
          currentMacros,
          remainingMacros,
          availableIngredients: inputs.dataSource === 'all' ? availableIngredients : [],
          availableMeals: inputs.dataSource === 'all' ? availableMeals : [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      
      // Show notification if fallback recommendations were used
      if (data.fallback) {
        toast({
          title: "AI Service Timeout",
          description: "AI service took longer than 90 seconds, showing fallback recommendations. Try again later for personalized suggestions.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Recommendation Failed",
        description: "Failed to get meal recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleGenerateMeal = () => {
    if (!recommendations || recommendations.length === 0) {
      toast({
        title: "No Recommendations",
        description: "Please generate meal recommendations first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const mealInputs = {
        ...inputs,
        selectedRecommendation: recommendations[0], // Use the first (and only) recommendation
        allRecommendations: recommendations
      };
      
      const meal = mod.generateMeal(mealInputs);
      
      // Apply portion to the generated meal
      const mealWithPortion = {
        ...meal,
        calories: meal.calories * portion,
        protein: meal.protein * portion,
        carbs: meal.carbs * portion,
        fat: meal.fat * portion,
        portion: portion
      };
      
      onMealGenerated(mealWithPortion);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating meal:', error);
      toast({
        title: "Error",
        description: "Failed to generate meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMacroProgress = (meal: MealRecommendation) => {
    const totalRemaining = remainingMacros.calories;
    const mealCalories = meal.calories;
    const percentage = totalRemaining > 0 ? Math.min((mealCalories / totalRemaining) * 100, 100) : 0;
    return percentage;
  };

  const toggleSection = (mealName: string, section: string) => {
    const key = `${mealName}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSectionExpanded = (mealName: string, section: string) => {
    const key = `${mealName}-${section}`;
    return expandedSections[key] || false;
  };

  const Highlighter = ({ text }: { text: string }) => (
    <span className="text-xs text-emerald-600 dark:text-emerald-400">
      {text}
    </span>
  );

  const handleInputChange = (key: string, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  if (showAuth) {
    return (
      <BaseModModal
        open={open}
        onOpenChange={onOpenChange}
        mod={mod}
        onMealGenerated={onMealGenerated}
        icon={<Sparkles className="h-5 w-5" />}
      >
        {(handleGenerateMeal, portion, setPortion) => (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter AI passcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {authError && (
                <p className="text-sm text-red-500">{authError}</p>
              )}
            </div>
            <Button onClick={handleAuth} className="w-full">
              Authenticate
            </Button>
          </div>
        )}
      </BaseModModal>
    );
  }

  return (
    <BaseModModal
      open={open}
      onOpenChange={onOpenChange}
      mod={mod}
      onMealGenerated={onMealGenerated}
      icon={<Sparkles className="h-5 w-5" />}
    >
      {() => (
        <div className="space-y-6">
          {recommendations.length === 0 ? (
            <div className="space-y-4">
              {/* Input Fields */}
              {mod.inputs.map((input) => (
                <div key={input.key} className="space-y-2">
                  <Label htmlFor={input.key}>{input.label}</Label>
                  {input.type === 'select' ? (
                    <select
                      id={input.key}
                      value={inputs[input.key] || input.defaultValue || ''}
                      onChange={(e) => handleInputChange(input.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {input.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : input.type === 'radio' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {input.options?.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={inputs[input.key]?.includes(option.value) || false}
                            onChange={(e) => {
                              const currentValues = inputs[input.key] || [];
                              if (e.target.checked) {
                                handleInputChange(input.key, [...currentValues, option.value]);
                              } else {
                                handleInputChange(input.key, currentValues.filter((v: string) => v !== option.value));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Input
                      id={input.key}
                      type={input.type}
                      value={inputs[input.key] || ''}
                      onChange={(e) => handleInputChange(input.key, e.target.value)}
                      placeholder={input.placeholder}
                    />
                  )}
                </div>
              ))}

              {/* Current Macros Display */}
              <div className="bg-gray-90 p-4 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Your Current Status
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current Macros</p>
                    <p>{currentMacros.calories} cal</p>
                    <p>{currentMacros.protein}g protein, {currentMacros.carbs}g carbs, {currentMacros.fat}g fat</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p>{remainingMacros.calories} cal</p>
                    <p>{remainingMacros.protein}g protein, {remainingMacros.carbs}g carbs, {remainingMacros.fat}g fat</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGetRecommendations} 
                disabled={isLoading}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {isLoading ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Getting Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Recommendation</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setRecommendations([])}
                  size="sm"
                >
                  New Search
                </Button>
              </div>

              <div className="grid gap-4">
                {recommendations.map((meal, index) => (
                  <Card 
                    key={index} 
                    className="border-2 border-gray-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{meal.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {meal.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {Math.round(meal.confidence * 100)}% match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Macro Information */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-yellow-600">{meal.calories}</p>
                          <p className="text-gray-500">Calories</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-yellow-600">{meal.protein}g</p>
                          <p className="text-gray-500">Protein</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-yellow-600">{meal.carbs}g</p>
                          <p className="text-gray-500">Carbs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-yellow-600">{meal.fat}g</p>
                          <p className="text-gray-500">Fat</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Macro Progress</span>
                          <span>{Math.round(getMacroProgress(meal))}% of remaining</span>
                        </div>
                        <Progress value={getMacroProgress(meal)} className="h-2" />
                      </div>

                      {/* Ingredients Section */}
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleSection(meal.name, 'ingredients')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <span className="font-medium text-sm">Ingredients</span>
                            {isSectionExpanded(meal.name, 'ingredients') ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {isSectionExpanded(meal.name, 'ingredients') && (
                            <div className="bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm">
                                {meal.ingredients?.map((ingredient, index) => (
                                  <span key={index}>
                                    {`${ingredient.name} (${ingredient.quantity}) `}
                                    <Highlighter text={ingredient.unit} />
                                    {index < (meal.ingredients?.length || 0) - 1 && ", "}
                                  </span>
                                ))}
                              </p>
                            </div>
                          )}
                          </div>
                      )}

                      {/* Instructions Section */}
                      {meal.instructions && meal.instructions.length > 0 && (
                        <div className="space-y-2">
                        <button
                          onClick={() => toggleSection(meal.name, 'instructions')}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <span className="font-medium text-sm">Instructions</span>
                          {isSectionExpanded(meal.name, 'instructions') ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        {isSectionExpanded(meal.name, 'instructions') && (
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <ol className="text-sm space-y-1">
                              {meal.instructions?.map((instruction, index) => (
                                <li key={index} className="flex">
                                  <span className="font-medium mr-2">{index + 1}.</span>
                                  <span className="text-gray-100">{instruction}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                      )}

                      {/* Reasoning */}
                      <div className="bg-gray-900 p-3 rounded-lg">
                        <p className="text-sm text-gray-100">
                          <strong>Why this meal:</strong> {meal.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  onClick={handleGenerateMeal}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Today's Meals
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseModModal>
  );
};

export default AIFoodRecommendationModModal;
