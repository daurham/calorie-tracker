import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui';
import { getAiUsageSummary } from '@/lib/ai-infra/usage-client';
import type { AiMonthSummary } from '@/types/ai-infra';

const money = (value: number) => `$${value.toFixed(2)}`;

const AiUsageSection = () => {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<(AiMonthSummary & { warningReached?: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getAiUsageSummary()
      .then((next) => {
        if (!cancelled) setSummary(next);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load AI usage');
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div className="pt-4 border-t mt-6">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between p-0 h-auto font-medium text-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Usage
            </div>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-3 text-sm">
          {error && <p className="text-red-500">{error}</p>}
          {!error && !summary && <p className="text-muted-foreground">Loading usage…</p>}
          {summary && (
            <>
              <div>
                <p className="font-medium">{summary.monthLabel}</p>
                <p className={summary.warningReached ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {money(summary.spendUsd)} / {money(summary.monthlyLimitUsd)}
                </p>
              </div>
              <div className="space-y-1 text-muted-foreground">
                <p>Text requests: {summary.countsByType.text_parse}</p>
                <p>Label scans: {summary.countsByType.nutrition_label}</p>
                <p>Photo estimates: {summary.countsByType.photo_estimate}</p>
                <p>Cache hits: {summary.cachedRequestCount}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly limit: {money(summary.monthlyLimitUsd)} (server-controlled)
              </p>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AiUsageSection;
