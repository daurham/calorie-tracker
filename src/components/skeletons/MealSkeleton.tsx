import { Card, CardContent, Skeleton } from "../ui";

const MealSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default MealSkeleton;