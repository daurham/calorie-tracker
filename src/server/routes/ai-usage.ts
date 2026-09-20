import { loadBudgetConfig } from '../../lib/ai-infra/config.js';
import { PostgresAiStore } from '../../lib/ai-infra/postgres-store.js';

export async function handleAiUsage(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const budget = loadBudgetConfig();
    const store = new PostgresAiStore(budget);
    const summary = await store.getMonthSummary();
    res.status(200).json({
      month: summary.monthLabel,
      monthKey: summary.monthKey,
      spendUsd: summary.spendUsd,
      reservedUsd: summary.reservedUsd,
      monthlyLimitUsd: summary.monthlyLimitUsd,
      warningBudgetUsd: summary.warningBudgetUsd,
      requestCount: summary.requestCount,
      cachedRequestCount: summary.cachedRequestCount,
      countsByType: summary.countsByType,
      warningReached: summary.spendUsd >= summary.warningBudgetUsd,
      budgetExhausted: summary.spendUsd + summary.reservedUsd >= summary.monthlyLimitUsd,
    });
  } catch (error) {
    console.error('Error loading AI usage:', error);
    res.status(500).json({ error: 'Could not load AI usage' });
  }
}
