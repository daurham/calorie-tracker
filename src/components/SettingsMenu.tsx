import { useState } from "react";
import { Settings, Calculator, ArrowLeft } from "lucide-react";
import {
  Button, 
  Label, 
  Input, 
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

interface SettingsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyGoal: number;
  onDailyGoalChange: (goal: number) => void;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  onMacroGoalsChange: (goals: { protein: number; carbs: number; fat: number }) => void;
  visibleMacros: {
    protein: boolean;
    carbs: boolean;
    fat: boolean;
  };
  onVisibleMacrosChange: (visible: { protein: boolean; carbs: boolean; fat: boolean }) => void;
}

const SettingsMenu = ({ 
  open, 
  onOpenChange, 
  dailyGoal,
  onDailyGoalChange,
  macroGoals, 
  onMacroGoalsChange,
  visibleMacros,
  onVisibleMacrosChange
}: SettingsMenuProps) => {
  const [showBMICalculator, setShowBMICalculator] = useState(false);

  const handleGoalChange = (macro: string, value: string) => {
    onMacroGoalsChange({
      ...macroGoals,
      [macro]: parseFloat(value) || 0
    });
  };

  const handleVisibilityChange = (macro: string, visible: boolean) => {
    onVisibleMacrosChange({
      ...visibleMacros,
      [macro]: visible
    });
  };

  const calculateBMIGoals = (formData: FormData) => {
    const age = parseInt(formData.get('age') as string || '0');
    const heightInches = parseFloat(formData.get('height') as string || '0');
    const weightPounds = parseFloat(formData.get('weight') as string || '0');
    const gender = formData.get('gender') as string || '';
    const activityLevel = formData.get('activity') as string || '';
    const goal = formData.get('goal') as string || '';

    if (!age || !heightInches || !weightPounds || !gender || !activityLevel || !goal) {
      alert('Please fill in all fields');
      return;
    }

    // Convert to metric for calculations
    const heightCm = heightInches * 2.54;
    const weightKg = weightPounds * 0.453592;

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Apply activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      lightly: 1.375,
      moderately: 1.55,
      very: 1.725,
      extremely: 1.9
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    // Apply goal adjustment
    let targetCalories;
    switch (goal) {
      case 'lose':
        targetCalories = tdee - 500; // 500 calorie deficit
        break;
      case 'maintain':
        targetCalories = tdee;
        break;
      case 'gain':
        targetCalories = tdee + 300; // 300 calorie surplus
        break;
      default:
        targetCalories = tdee;
    }

    // Calculate macro distribution (40% carbs, 30% protein, 30% fat)
    const proteinGrams = Math.round((targetCalories * 0.3) / 4);
    const carbsGrams = Math.round((targetCalories * 0.4) / 4);
    const fatGrams = Math.round((targetCalories * 0.3) / 9);

    // Update the goals
    onDailyGoalChange(Math.round(targetCalories));
    onMacroGoalsChange({
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams
    });

    // Reset to settings view
    setShowBMICalculator(false);
  };

  const BMICalculator = () => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      calculateBMIGoals(formData);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBMICalculator(false)}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="25"
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                name="gender"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Height (inches)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                placeholder="70"
                required
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (pounds)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                placeholder="154"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="activity">Activity Level</Label>
            <select
              name="activity"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="lightly">Lightly active (light exercise 1-3 days/week)</option>
              <option value="moderately">Moderately active (moderate exercise 3-5 days/week)</option>
              <option value="very">Very active (hard exercise 6-7 days/week)</option>
              <option value="extremely">Extremely active (very hard exercise, physical job)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="goal">Weight Goal</Label>
            <select
              name="goal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select your goal</option>
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
          </div>

          <Button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Goals
          </Button>
        </form>
      </div>
    );
  };

  const SettingsView = () => {
    const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log('Form submitted!');
      const formData = new FormData(e.currentTarget);
      
      const newDailyGoal = parseFloat(formData.get('dailyGoal') as string) || 0;
      const newProtein = parseFloat(formData.get('protein') as string) || 0;
      const newCarbs = parseFloat(formData.get('carbs') as string) || 0;
      const newFat = parseFloat(formData.get('fat') as string) || 0;
      
      console.log('New values:', { newDailyGoal, newProtein, newCarbs, newFat });
      
      onDailyGoalChange(newDailyGoal);
      onMacroGoalsChange({
        protein: newProtein,
        carbs: newCarbs,
        fat: newFat
      });
      
      // Close the dialog after saving
      onOpenChange(false);
    };

    return (
      <div className="space-y-6">
        <form id="settings-form" onSubmit={handleSettingsSubmit}>
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="calorie-goal">Daily Calories</Label>
                <Input
                  id="calorie-goal"
                  name="dailyGoal"
                  type="number"
                  defaultValue={dailyGoal}
                  className="w-24"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="protein-goal">Protein (g)</Label>
                <Input
                  id="protein-goal"
                  name="protein"
                  type="number"
                  defaultValue={macroGoals.protein}
                  className="w-20"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="carbs-goal">Carbs (g)</Label>
                <Input
                  id="carbs-goal"
                  name="carbs"
                  type="number"
                  defaultValue={macroGoals.carbs}
                  className="w-20"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="fat-goal">Fat (g)</Label>
                <Input
                  id="fat-goal"
                  name="fat"
                  type="number"
                  defaultValue={macroGoals.fat}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t mt-6">
            <h3 className="text-sm font-medium mb-4">Visible Macros</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-protein">Show Protein</Label>
                <Switch
                  id="show-protein"
                  checked={visibleMacros.protein}
                  onCheckedChange={(checked) => handleVisibilityChange("protein", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-carbs">Show Carbs</Label>
                <Switch
                  id="show-carbs"
                  checked={visibleMacros.carbs}
                  onCheckedChange={(checked) => handleVisibilityChange("carbs", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-fat">Show Fat</Label>
                <Switch
                  id="show-fat"
                  checked={visibleMacros.fat}
                  onCheckedChange={(checked) => handleVisibilityChange("fat", checked)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-muted-foreground mb-3">
              Not sure about your goals? Calculate them based on your BMI and activity level.
            </p>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowBMICalculator(true)}
              className="w-full mb-4"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Goals with BMI
            </Button>
            
            <div className="flex justify-end gap-2">
            <Button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Save Changes
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

            </div>
          </div>
        </form>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showBMICalculator ? (
              <>
                <Calculator className="h-5 w-5" />
                BMI Calculator
              </>
            ) : (
              <>
                <Settings className="h-5 w-5" />
                Settings
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showBMICalculator 
              ? "Enter your details to calculate personalized nutrition goals."
              : "Configure your daily goals and visibility preferences."
            }
          </DialogDescription>
        </DialogHeader>

        {showBMICalculator ? <BMICalculator /> : <SettingsView />}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsMenu;
