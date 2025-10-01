import { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';

interface BaseModModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
  children: (handleGenerateMeal: (inputs: Record<string, any>) => void, portion: number, setPortion: (portion: number) => void) => React.ReactNode;
  icon?: React.ReactNode;
}

const BaseModModal = ({ 
  open, 
  onOpenChange, 
  mod, 
  onMealGenerated, 
  children, 
  icon = <Calculator className="h-5 w-5" />
}: BaseModModalProps) => {
  const [portion, setPortion] = useState(1);

  const handleGenerateMeal = (inputs: Record<string, any>) => {
    try {
      const meal = mod.generateMeal(inputs);
      // Apply portion to the generated meal
      const mealWithPortion = {
        ...meal,
        portion: portion
      };
      onMealGenerated(mealWithPortion);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating meal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {mod.name}
          </DialogTitle>
          <DialogDescription>
            {mod.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mod-specific content */}
          {children(handleGenerateMeal, portion, setPortion)}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BaseModModal; 