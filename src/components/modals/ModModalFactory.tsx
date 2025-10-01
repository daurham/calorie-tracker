import { ModHandler, ModMeal } from '@/types/mods';
import CostcoPizzaModal from './CostcoPizzaModal';
import CustomFoodModal from './CustomFoodModal';
import IngredientMixerModal from './IngredientMixerModal';
import { AIFoodRecognitionModal } from './AIFoodRecognitionModal';

interface ModModalFactoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
  availableIngredients?: any[];
}

const ModModalFactory = ({ open, onOpenChange, mod, onMealGenerated, availableIngredients = [] }: ModModalFactoryProps) => {
  // Route to the appropriate modal based on mod ID
  switch (mod.id) {
    case 'costco-pizza-slice':
      return (
        <CostcoPizzaModal
          open={open}
          onOpenChange={onOpenChange}
          mod={mod}
          onMealGenerated={onMealGenerated}
        />
      );
    
    case 'custom-food':
      return (
        <CustomFoodModal
          open={open}
          onOpenChange={onOpenChange}
          mod={mod}
          onMealGenerated={onMealGenerated}
        />
      );
    
    case 'ingredient-mixer':
      return (
        <IngredientMixerModal
          open={open}
          onOpenChange={onOpenChange}
          mod={mod}
          onMealGenerated={onMealGenerated}
          availableIngredients={availableIngredients}
        />
      );
    
    case 'ai-food-recognition':
      return (
        <AIFoodRecognitionModal
          isOpen={open}
          onClose={() => onOpenChange(false)}
          onGenerateMeal={onMealGenerated}
        />
      );
    
    default:
      // Fallback to a generic modal for unknown mods
      console.warn(`No specific modal found for mod: ${mod.id}`);
      return null;
  }
};

export default ModModalFactory; 