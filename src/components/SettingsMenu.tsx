import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MacroSettingsProps {
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

const MacroSettings = ({ 
  open, 
  onOpenChange, 
  dailyGoal,
  onDailyGoalChange,
  macroGoals, 
  onMacroGoalsChange,
  visibleMacros,
  onVisibleMacrosChange
}: MacroSettingsProps) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your daily goals and visibility preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            {/* <h3 className="text-sm font-medium mb-4">Daily Goals</h3> */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="calorie-goal">Daily Calories</Label>
                <Input
                  id="calorie-goal"
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => onDailyGoalChange(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="protein-goal">Protein (g)</Label>
                <Input
                  id="protein-goal"
                  type="number"
                  value={macroGoals.protein}
                  onChange={(e) => handleGoalChange("protein", e.target.value)}
                  className="w-20"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="carbs-goal">Carbs (g)</Label>
                <Input
                  id="carbs-goal"
                  type="number"
                  value={macroGoals.carbs}
                  onChange={(e) => handleGoalChange("carbs", e.target.value)}
                  className="w-20"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="fat-goal">Fat (g)</Label>
                <Input
                  id="fat-goal"
                  type="number"
                  value={macroGoals.fat}
                  onChange={(e) => handleGoalChange("fat", e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <div>
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
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MacroSettings;
