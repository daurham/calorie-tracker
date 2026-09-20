import { Clock3, Loader2, Plus } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { candidateKey, formatUsage, isEstimatedCandidate } from '@/lib/quick-log';
import type { SearchCandidate } from '@/types/food-search';

interface RecentFrequentProps {
  items: SearchCandidate[];
  addingKey: string | null;
  onAdd: (candidate: SearchCandidate) => void;
}

const RecentFrequent = ({ items, addingKey, onAdd }: RecentFrequentProps) => {
  if (items.length === 0) return null;

  return (
    <Card className="mb-6 sm:mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Clock3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
          Recent / Frequent
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => {
            const key = candidateKey(item);
            const estimated = isEstimatedCandidate(item);
            const usage = formatUsage(item);
            return (
              <div
                key={key}
                className="min-w-[11.5rem] shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {estimated ? '~' : ''}
                      {item.calories} cal
                      {item.servingDescription ? ` · ${item.servingDescription}` : ''}
                    </p>
                    {usage && <p className="mt-0.5 text-xs text-muted-foreground">{usage}</p>}
                  </div>
                  <Button
                    size="sm"
                    disabled={addingKey === key}
                    onClick={() => onAdd(item)}
                    className="h-8 w-8 bg-emerald-500 p-0 hover:bg-emerald-600"
                    aria-label={`Add ${item.name}`}
                  >
                    {addingKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentFrequent;
