import type { EstimateOutcome } from '../../types/food-interpretation';
import type { ImageInput } from '../../types/nutrition-label';

export async function estimateFoodRequest(input: { text: string } | { image: ImageInput; text?: string }): Promise<EstimateOutcome> {
  const payload = 'image' in input
    ? { input: { type: 'photo', image: input.image, text: input.text || null } }
    : { input: { type: 'text', text: input.text } };
  const response = await fetch('/api/quick-log/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({ error: response.statusText }));
  if (!response.ok && data.status !== 'error') {
    return {
      status: 'error',
      code: data.code || 'provider_unavailable',
      message: data.message || data.error || "Couldn't estimate this food.",
      fallback: 'manual',
    };
  }
  return data as EstimateOutcome;
}
