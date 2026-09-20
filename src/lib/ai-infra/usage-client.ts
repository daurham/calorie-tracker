import type { AiMonthSummary } from '../../types/ai-infra';

export async function getAiUsageSummary(): Promise<AiMonthSummary & {
  warningReached: boolean;
  budgetExhausted: boolean;
}> {
  const response = await fetch('/api/ai/usage');
  const data = await response.json().catch(() => ({ error: response.statusText }));
  if (!response.ok) {
    throw new Error(data.error || 'Could not load AI usage');
  }
  return {
    monthKey: data.monthKey,
    monthLabel: data.month,
    spendUsd: Number(data.spendUsd || 0),
    reservedUsd: Number(data.reservedUsd || 0),
    monthlyLimitUsd: Number(data.monthlyLimitUsd),
    warningBudgetUsd: Number(data.warningBudgetUsd),
    requestCount: Number(data.requestCount || 0),
    cachedRequestCount: Number(data.cachedRequestCount || 0),
    countsByType: data.countsByType || {
      nutrition_label: 0,
      text_parse: 0,
      food_estimate: 0,
      photo_estimate: 0,
    },
    warningReached: Boolean(data.warningReached),
    budgetExhausted: Boolean(data.budgetExhausted),
  };
}
