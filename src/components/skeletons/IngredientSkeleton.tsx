import { Card, CardContent, Skeleton } from "../ui";

const IngredientSkeleton = (index) => (
  <Card key={index} className="bg-emerald-50 dark:bg-emerald-900">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
    </CardContent>
  </Card>
)

export default IngredientSkeleton;