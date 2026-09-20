export interface ModelPricing {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
}

const DEFAULT_PRICING: ModelPricing = {
  inputPerMillionUsd: 0.15,
  outputPerMillionUsd: 0.6,
};

const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-2.0-flash': { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.4 },
  'gemini-3.6-flash': { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 },
  'gemini-2.0-flash-lite': { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.3 },
  'gemini-2.5-flash': { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 },
  'gemini-1.5-flash': { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.3 },
  'gemini-1.5-pro': { inputPerMillionUsd: 1.25, outputPerMillionUsd: 5 },
};

export const pricingForModel = (model: string, env: NodeJS.ProcessEnv = process.env): ModelPricing => {
  const named = MODEL_PRICING[model] || DEFAULT_PRICING;
  return {
    inputPerMillionUsd: Number(env.AI_INPUT_PRICE_PER_MILLION_USD) || named.inputPerMillionUsd,
    outputPerMillionUsd: Number(env.AI_OUTPUT_PRICE_PER_MILLION_USD) || named.outputPerMillionUsd,
  };
};

export const costFromTokens = (
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
  env?: NodeJS.ProcessEnv
) => {
  if (inputTokens == null && outputTokens == null) return null;
  const pricing = pricingForModel(model, env);
  const input = (inputTokens || 0) / 1_000_000 * pricing.inputPerMillionUsd;
  const output = (outputTokens || 0) / 1_000_000 * pricing.outputPerMillionUsd;
  return Number((input + output).toFixed(6));
};

export const estimateMaxLabelCostUsd = (model: string, imageBytes: number, env?: NodeJS.ProcessEnv) => {
  const estimatedInputTokens = Math.max(400, Math.ceil(imageBytes / 600) + 700);
  const estimatedOutputTokens = 1024;
  return costFromTokens(model, estimatedInputTokens, estimatedOutputTokens, env) ?? 0.002;
};

export const estimateMaxTextCostUsd = (model: string, env?: NodeJS.ProcessEnv) =>
  costFromTokens(model, 900, 700, env) ?? 0.001;

export const estimateMaxPhotoCostUsd = (model: string, imageBytes: number, env?: NodeJS.ProcessEnv) =>
  estimateMaxLabelCostUsd(model, imageBytes, env);

export const settleCostUsd = (input: {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  reservedCostUsd: number;
}) => {
  const actual = costFromTokens(input.model, input.inputTokens, input.outputTokens);
  if (actual != null) return actual;
  return Number(input.reservedCostUsd.toFixed(6));
};
