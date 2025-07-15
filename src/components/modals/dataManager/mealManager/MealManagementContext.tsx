import { createContext, useContext, ReactNode } from 'react';
import { Ingredient, Meal } from '@/types';

interface MealManagementContextType {
  // Form state
  formData: {
    name: string;
    meal_type: 'composed' | 'standalone';
    ingredients: Array<{ id: number; name: string; quantity: number }>;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes: string;
    instructions: string;
  };
  setFormData: (data: any) => void;
  
  // Mode state
  mode: 'add' | 'edit' | 'none';
  setMode: (mode: 'add' | 'edit' | 'none') => void;
  
  // Selected ingredients (for add mode)
  selectedIngredients: any[];
  setSelectedIngredients: (ingredients: any[]) => void;
  
  // Collapsible states
  notesCollapsed: boolean;
  setNotesCollapsed: (collapsed: boolean) => void;
  instructionsCollapsed: boolean;
  setInstructionsCollapsed: (collapsed: boolean) => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Original ingredients (for edit mode)
  originalIngredients: Array<{ id: number; name: string; quantity: number }>;
  setOriginalIngredients: (ingredients: Array<{ id: number; name: string; quantity: number }>) => void;
  
  // Original standalone macros (for edit mode)
  originalStandaloneMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  setOriginalStandaloneMacros: (macros: { calories: number; protein: number; carbs: number; fat: number }) => void;
  
  // Meal type
  mealType: 'composed' | 'standalone';
  setMealType: (type: 'composed' | 'standalone') => void;
  
  // Data
  meals: Meal[];
  availableIngredients: Ingredient[];
  filteredIngredients: Ingredient[];
  filteredMeals: Meal[];
  isLoading: boolean;
  
  // Actions
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (ingredientId: number) => void;
  updateQuantity: (ingredientId: number, quantity: number) => void;
  handleIngredientChange: (index: number, field: 'id' | 'quantity', value: number) => void;
  handleRemoveIngredient: (index: number) => void;
  handleAddIngredient: () => void;
  handleSubmit: (e?: React.FormEvent, addAsNew?: boolean) => Promise<void>;
  handleEdit: (mealCombo: any) => void;
  handleDeleteClick: (id: number) => void;
  resetForm: () => void;
  handleDialogClose: (open: boolean) => void;
  
  // Calculations
  calculateTotals: (ingredients: { id: number; name: string; quantity: number }[]) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  addModeTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  editModeTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const MealManagementContext = createContext<MealManagementContextType | undefined>(undefined);

export const useMealManagement = () => {
  const context = useContext(MealManagementContext);
  if (!context) {
    throw new Error('useMealManagement must be used within a MealManagementProvider');
  }
  return context;
};

interface MealManagementProviderProps {
  children: ReactNode;
  value: MealManagementContextType;
}

export const MealManagementProvider = ({ children, value }: MealManagementProviderProps) => {
  return (
    <MealManagementContext.Provider value={value}>
      {children}
    </MealManagementContext.Provider>
  );
}; 