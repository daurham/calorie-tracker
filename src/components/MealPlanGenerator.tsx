import { useState, useEffect } from 'react';
import { useMealPlanGenerator, useToast } from '@/hooks';
import { Loader2, Copy, Download, Sparkles, Info } from 'lucide-react';
import { 
  Button, 
  Textarea, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Alert, 
  AlertDescription,
 } from './ui';

const MealPlanGenerator = () => {
  const { toast } = useToast();
  const [userGoals, setUserGoals] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [storedMacros, setStoredMacros] = useState({
    dailyGoal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  const { generatePrompt, isLoading, error, lastGeneratedPrompt, lastSummary } = useMealPlanGenerator();

  // Load macro goals from localStorage on component mount
  useEffect(() => {
    const loadStoredMacros = () => {
      const storedDailyGoal = localStorage.getItem('nutritrack_daily_goal');
      const storedMacroGoals = localStorage.getItem('nutritrack_macro_goals');
      
      if (storedDailyGoal || storedMacroGoals) {
        const dailyGoal = storedDailyGoal ? parseInt(storedDailyGoal) : 0;
        const macroGoals = storedMacroGoals ? JSON.parse(storedMacroGoals) : { protein: 0, carbs: 0, fat: 0 };
        
        setStoredMacros({
          dailyGoal,
          protein: macroGoals.protein || 0,
          carbs: macroGoals.carbs || 0,
          fat: macroGoals.fat || 0
        });
        
        // Auto-populate user goals if they haven't been set yet
        if (!userGoals && (dailyGoal > 0 || macroGoals.protein > 0 || macroGoals.carbs > 0 || macroGoals.fat > 0)) {
          const goalsText = `I want to eat ${dailyGoal} calories per day with ${macroGoals.protein}g protein, ${macroGoals.carbs}g carbs, and ${macroGoals.fat}g fat.`;
          setUserGoals(goalsText);
          setHasLoadedFromStorage(true);
          
          // Show notification
          toast({
            title: 'Macro goals loaded from your settings!',
            description: 'Your daily calorie and macro goals have been automatically filled in.'
          });
        } else if (userGoals && hasLoadedFromStorage) {
          // If user has manually entered goals, don't show the loaded notification again
          setHasLoadedFromStorage(false);
        }
      }
    };
    
    loadStoredMacros();
  }, [userGoals]);

  const handleGeneratePrompt = async () => {
    const result = await generatePrompt(userGoals);
    if (result) {
      setShowPrompt(true);
      toast({
        title: 'Meal plan prompt generated successfully!',
      });
    }
  };

  const handleCopyPrompt = async () => {
    if (lastGeneratedPrompt) {
      try {
        await navigator.clipboard.writeText(lastGeneratedPrompt);
        toast({
          title: 'Prompt copied to clipboard!',
        });
      } catch (err) {
        toast({
          title: 'Failed to copy prompt',
        });
      }
    }
  };

  const handleDownloadPrompt = () => {
    if (lastGeneratedPrompt) {
      const blob = new Blob([lastGeneratedPrompt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meal-plan-prompt-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Prompt downloaded!',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Meal Plan Prompt Generator
          </CardTitle>
          <CardDescription>
            Generate a personalized meal plan prompt based on your available ingredients and existing meals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="goals" className="text-sm font-medium">
              Your Goals (Optional)
            </label>
            <Textarea
              id="goals"
              placeholder="e.g., I want to eat 2000 calories per day with 150g protein, 200g carbs, and 70g fat. I'm trying to build muscle while staying lean."
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Add your specific macro goals, dietary restrictions, or preferences to get more personalized suggestions. Preset macros are provided.
            </p>
            
            {/* Show loaded macro goals if available */}
            {hasLoadedFromStorage && storedMacros.dailyGoal > 0 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Macro goals loaded from your settings:</p>
                  <p>Daily Calories: {storedMacros.dailyGoal} • Protein: {storedMacros.protein}g • Carbs: {storedMacros.carbs}g • Fat: {storedMacros.fat}g</p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">You can edit these goals above if needed.</p>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleGeneratePrompt} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Prompt...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Prompt
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {lastSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Your available ingredients and meals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Ingredients:</span> {lastSummary.totalIngredients}
              </div>
              <div>
                <span className="font-medium">Meals:</span> {lastSummary.totalMeals}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showPrompt && lastGeneratedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Generated AI Prompt</CardTitle>
            <CardDescription>
              Copy this prompt and use it with your preferred AI tool (ChatGPT, Claude, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                value={lastGeneratedPrompt}
                readOnly
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopyPrompt} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy Prompt
              </Button>
              <Button onClick={handleDownloadPrompt} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 

export default MealPlanGenerator;