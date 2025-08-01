import { ModHandler, ModMeal } from '@/types/mods';
import CostcoPizzaModal from './CostcoPizzaModal';
import CustomFoodModal from './CustomFoodModal';

interface ModModalFactoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
}

const ModModalFactory = ({ open, onOpenChange, mod, onMealGenerated }: ModModalFactoryProps) => {
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
    
    default:
      // Fallback to a generic modal for unknown mods
      console.warn(`No specific modal found for mod: ${mod.id}`);
      return null;
  }
};

export default ModModalFactory; 