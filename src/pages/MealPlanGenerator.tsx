import { MealPlanGenerator } from '../components/MealPlanGenerator';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MealPlanGeneratorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            AI Meal Plan Prompt Generator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Generate personalized meal plans using AI based on your available ingredients and existing meals.
          </p>
        </div>

        {/* Meal Plan Generator Component */}
        <MealPlanGenerator />
      </div>
    </div>
  );
}

export default MealPlanGeneratorPage; 