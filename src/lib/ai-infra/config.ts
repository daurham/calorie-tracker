import type { AiBudgetConfig } from '../../types/ai-infra.js';

const DEFAULT_MONTHLY_BUDGET_USD = 3;
const DEFAULT_WARNING_BUDGET_USD = 2;

const parseUsd = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const loadBudgetConfig = (env: NodeJS.ProcessEnv = process.env): AiBudgetConfig => {
  const monthlyBudgetUsd = parseUsd(env.AI_MONTHLY_BUDGET_USD, DEFAULT_MONTHLY_BUDGET_USD);
  const warningBudgetUsd = parseUsd(env.AI_WARNING_BUDGET_USD, DEFAULT_WARNING_BUDGET_USD);
  return {
    monthlyBudgetUsd,
    warningBudgetUsd: Math.min(warningBudgetUsd, monthlyBudgetUsd),
  };
};

export const calendarMonthRange = (now: Date) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(start);
  return { start, end, monthKey, monthLabel, monthOrdinal: start.getUTCFullYear() * 12 + start.getUTCMonth() };
};

export const loadAiProviderConfig = (env: NodeJS.ProcessEnv = process.env) => ({
  provider: env.AI_PROVIDER || 'gemini',
  model: env.AI_MODEL || 'gemini-2.0-flash',
  apiKey: env.GEMINI_API_KEY || env.AI_GOOGLE_STUDIO_GEMINI_API_KEY || '',
});
