import { ProviderError } from '../../types/nutrition-provider.js';
import type { FoodAIProvider, ImageInput, NutritionLabelResult } from '../../types/nutrition-label.js';
import type { FoodInterpretation } from '../../types/food-interpretation.js';
import type { AiCallUsage } from '../../types/ai-infra.js';
import { NUTRITION_LABEL_PROMPT_VERSION, NUTRITION_LABEL_SCHEMA_VERSION } from '../ai-infra/gate.js';
import { sanitizeFoodInterpretation } from '../food-estimate/sanitize.js';
import { sanitizeNutritionLabel } from './validate-label.js';

export { NUTRITION_LABEL_PROMPT_VERSION, NUTRITION_LABEL_SCHEMA_VERSION };

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 35000;
const RETRY_DELAY_MS = 800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGeminiStatus = (status: number) =>
  status === 429 || status === 503 || status === 500;

const LABEL_PROMPT = `You transcribe packaged-food nutrition labels. Do not estimate missing values.
Return ONLY JSON with this shape:
{
  "productName": string | null,
  "serving": { "description": string | null, "amount": number | null, "unit": string | null, "gramWeight": number | null },
  "calories": number | null,
  "protein": number | null,
  "carbs": number | null,
  "fat": number | null,
  "servingsPerContainer": number | null,
  "confidence": { "calories": "high"|"medium"|"low", "protein": "high"|"medium"|"low", "carbs": "high"|"medium"|"low", "fat": "high"|"medium"|"low" }
}
Use null when a field is not clearly printed. Never invent grams.`;

const INTERPRETATION_PROMPT = `You interpret food descriptions or photos. You do NOT replace a nutrition database.
Return ONLY JSON:
{
  "displayName": string,
  "portion": { "description": string | null, "estimatedWeightGrams": number | null },
  "components": [{ "name": string, "quantityDescription": string | null, "estimatedWeightGrams": number | null, "attributes": { "preparation"?: string, "filling"?: string, "size"?: string } }],
  "assumptions": string[],
  "confidence": "high" | "medium" | "low",
  "fallbackNutrition": {
    "calories": number | null,
    "protein": number | null,
    "carbs": number | null,
    "fat": number | null,
    "calorieLow": number | null,
    "calorieHigh": number | null
  } | null
}
Identify foods, portions, visible components, and uncertainty.
Prefer identity + estimated grams over a single calorie number.
Include fallbackNutrition with a calorie RANGE when the food is homemade, restaurant, mixed, or otherwise hard to look up.
Never return calories alone without macros or a range.
Use null when unknown. Do not invent barcode-level precision.`;

export interface LabelExtractionWithUsage {
  result: NutritionLabelResult;
  usage: AiCallUsage;
}

export class GeminiFoodAIProvider implements FoodAIProvider {
  constructor(private options: { fetchImpl?: typeof fetch; apiKey?: string; model?: string; timeoutMs?: number } = {}) {}

  async extractNutritionLabel(image: ImageInput): Promise<NutritionLabelResult> {
    return (await this.extractNutritionLabelWithUsage(image)).result;
  }

  async parseFoodDescription(input: string): Promise<FoodInterpretation> {
    return (await this.parseFoodDescriptionWithUsage(input)).result;
  }

  async analyzeFoodImage(image: ImageInput, context?: string): Promise<FoodInterpretation> {
    return (await this.analyzeFoodImageWithUsage(image, context)).result;
  }

  async extractNutritionLabelWithUsage(image: ImageInput): Promise<LabelExtractionWithUsage> {
    const { parsed, usage } = await this.callGeminiJson({
      parts: [
        { text: LABEL_PROMPT },
        { inline_data: { mime_type: image.mimeType, data: image.dataBase64 } },
      ],
      failure: 'label extraction',
    });
    return { result: sanitizeNutritionLabel(parsed), usage };
  }

  async parseFoodDescriptionWithUsage(input: string) {
    const { parsed, usage } = await this.callGeminiJson({
      parts: [{ text: `${INTERPRETATION_PROMPT}\n\nFood description:\n${input}` }],
      failure: 'food interpretation',
    });
    return { result: sanitizeFoodInterpretation(parsed), usage };
  }

  async analyzeFoodImageWithUsage(image: ImageInput, context?: string) {
    const contextLine = context?.trim() ? `\nOptional user description:\n${context.trim()}` : '';
    const { parsed, usage } = await this.callGeminiJson({
      parts: [
        { text: `${INTERPRETATION_PROMPT}\nInterpret this food photo.${contextLine}` },
        { inline_data: { mime_type: image.mimeType, data: image.dataBase64 } },
      ],
      failure: 'photo interpretation',
    });
    return { result: sanitizeFoodInterpretation(parsed), usage };
  }

  private async callGeminiJson(input: { parts: any[]; failure: string; retried?: boolean }) {
    const apiKey = this.options.apiKey || process.env.GEMINI_API_KEY || process.env.AI_GOOGLE_STUDIO_GEMINI_API_KEY;
    if (!apiKey) {
      throw new ProviderError('missing_key', 'GEMINI_API_KEY is not configured');
    }
    const configuredProvider = this.options.apiKey ? 'gemini' : (process.env.AI_PROVIDER || 'gemini');
    if (configuredProvider !== 'gemini') {
      throw new ProviderError('provider_error', 'AI_PROVIDER is not gemini');
    }

    const model = this.options.model || process.env.AI_MODEL || DEFAULT_MODEL;
    const fetchImpl = this.options.fetchImpl || fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const started = Date.now();
    const retry = async () => {
      if (input.retried) return null;
      await sleep(RETRY_DELAY_MS);
      return this.callGeminiJson({ ...input, retried: true });
    };

    try {
      const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: input.parts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        if (isRetryableGeminiStatus(response.status)) {
          const retried = await retry();
          if (retried) return retried;
        }
        throw new ProviderError('provider_error', `Gemini ${input.failure} failed (${response.status})`);
      }
      const payload = await response.json();
      const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join('') || '';
      const parsed = JSON.parse(text);
      const usageMeta = payload?.usageMetadata || {};
      return {
        parsed,
        usage: {
          provider: 'gemini' as const,
          model,
          inputTokens: Number.isFinite(usageMeta.promptTokenCount) ? Number(usageMeta.promptTokenCount) : null,
          outputTokens: Number.isFinite(usageMeta.candidatesTokenCount) ? Number(usageMeta.candidatesTokenCount) : null,
          latencyMs: Date.now() - started,
        },
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if ((error as { name?: string })?.name === 'AbortError') {
        const retried = await retry();
        if (retried) return retried;
        throw new ProviderError('timeout', `Gemini ${input.failure} timed out`);
      }
      if (error instanceof SyntaxError) {
        throw new ProviderError('malformed', `Gemini returned unstructured ${input.failure} data`);
      }
      throw new ProviderError('provider_error', error instanceof Error ? error.message : `Gemini ${input.failure} failed`);
    } finally {
      clearTimeout(timer);
    }
  }
}
