import { Calendar, ChevronDown, ChevronRight } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui";

interface QuickStatsProps {
  todaysMeals: any[];
  dailyCalories: number;
  progressPercentage: number;
  showMacros: boolean;
  visibleMacros: {
    protein: boolean;
    carbs: boolean;
    fat: boolean;
  };
  macroProgress: {
    protein: number;
    carbs: number;
    fat: number;
  };
  formatMacroProgress: (progress: number | string) => string;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

// Reusable stat row component
const StatRow = ({ label, value, valueColor = "font-semibold" }: {
  label: string;
  value: string | number;
  valueColor?: string;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
    <span className={`${valueColor} text-sm sm:text-base`}>{value}</span>
  </div>
);

// Macro stat row component
const MacroStatRow = ({ 
  macro, 
  value, 
  color, 
  formatMacroProgress 
}: {
  macro: string;
  value: number;
  color: string;
  formatMacroProgress: (progress: number | string) => string;
}) => (
  <StatRow
    label={macro}
    value={formatMacroProgress(value)}
    valueColor={`font-semibold ${color}`}
  />
);

// Goal status component
const GoalStatus = ({ progressPercentage }: { progressPercentage: number }) => {
  const getStatusConfig = (percentage: number) => {
    if (percentage >= 100) {
      return { text: 'Complete!', color: 'text-emerald-600 dark:text-emerald-400' };
    } else if (percentage >= 75) {
      return { text: 'Almost there', color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { text: 'On track', color: 'text-blue-600 dark:text-blue-400' };
    }
  };

  const status = getStatusConfig(progressPercentage);

  return (
    <StatRow
      label="Goal status"
      value={status.text}
      valueColor={`text-xs sm:text-sm font-semibold ${status.color}`}
    />
  );
};

// Macro stats section component
const MacroStats = ({ 
  showMacros, 
  visibleMacros, 
  macroProgress, 
  formatMacroProgress 
}: {
  showMacros: boolean;
  visibleMacros: { protein: boolean; carbs: boolean; fat: boolean };
  macroProgress: { protein: number; carbs: number; fat: number };
  formatMacroProgress: (progress: number | string) => string;
}) => {
  if (!showMacros) return null;

  const macroConfigs = [
    { key: 'protein', color: 'text-blue-600 dark:text-blue-400' },
    { key: 'carbs', color: 'text-orange-600 dark:text-orange-400' },
    { key: 'fat', color: 'text-purple-600 dark:text-purple-400' }
  ] as const;

  return (
    <>
      {macroConfigs.map(({ key, color }) => 
        visibleMacros[key] && (
          <MacroStatRow
            key={key}
            macro={key.charAt(0).toUpperCase() + key.slice(1)}
            value={macroProgress[key]}
            color={color}
            formatMacroProgress={formatMacroProgress}
          />
        )
      )}
    </>
  );
};

const QuickStats = ({
  todaysMeals,
  dailyCalories,
  progressPercentage,
  showMacros,
  visibleMacros,
  macroProgress,
  formatMacroProgress,
  isCollapsed = false,
  setIsCollapsed
}: QuickStatsProps) => {
  const averageCalories = todaysMeals.length > 0 ? Math.round(dailyCalories / todaysMeals.length) : 0;

  const statsContent = (
    <div className="space-y-3 sm:space-y-4">
      <StatRow label="Avg. per meal" value={`${averageCalories} cal`} />
      <StatRow 
        label="Progress" 
        value={`${Math.round(progressPercentage)}%`}
        valueColor="font-semibold text-emerald-600 dark:text-emerald-400"
      />
      <MacroStats
        showMacros={showMacros}
        visibleMacros={visibleMacros}
        macroProgress={macroProgress}
        formatMacroProgress={formatMacroProgress}
      />
      <GoalStatus progressPercentage={progressPercentage} />
    </div>
  );

  const cardTitle = (
    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-lg sm:text-xl">
      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
      Quick Stats
    </CardTitle>
  );

  const collapseIcon = isCollapsed ? (
    <ChevronRight className="h-4 w-4" />
  ) : (
    <ChevronDown className="h-4 w-4" />
  );

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-6">
        {/* Mobile: Collapsible */}
        <div className="block sm:hidden">
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed?.(!open)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
              >
                {cardTitle}
                {collapseIcon}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                {statsContent}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Desktop: Always visible */}
        <div className="hidden sm:block">
          {cardTitle}
          <CardContent className="pt-4">
            {statsContent}
          </CardContent>
        </div>
      </CardHeader>
    </Card>
  );
};

export default QuickStats; 