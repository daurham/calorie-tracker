import { Button } from "@/components/ui";
import { Plus } from "lucide-react";
import { useMealManagement } from "./MealManagementContext";

const LeftColumnNeutral = () => {
  const { setMode, isLoading } = useMealManagement();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Add New Meal
        </h3>
      </div>
      
      <Button onClick={() => setMode('add')} className="w-full" disabled={isLoading}>
        <Plus className="h-4 w-4 mr-2" />
        Add New Meal
      </Button>
    </div>
  );
};

export default LeftColumnNeutral;