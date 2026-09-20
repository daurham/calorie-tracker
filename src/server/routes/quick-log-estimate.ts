import { loadPersonalSearchRecords } from '../../lib/food-search/load-personal.js';
import { searchLocalKnowledge } from '../../lib/food-search/search.js';
import { USDAFoodDataProvider } from '../../lib/nutrition-providers/index.js';
import { GeminiFoodAIProvider } from '../../lib/food-ai/gemini-label.js';
import { PostgresAiStore } from '../../lib/ai-infra/postgres-store.js';
import { estimateFood } from '../../lib/food-estimate/estimate.js';
import { parseQuantityQuery } from '../../lib/quick-log/index.js';

export async function handleQuickLogEstimate(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const body = req.body?.input || req.body || {};
  const type = body.type || (body.image ? 'photo' : 'text');
  const text = body.text || '';

  try {
    const query = text || 'food';
    const parsed = parseQuantityQuery(String(query));
    const records = await loadPersonalSearchRecords(parsed.foodQuery || String(query));
    const result = await estimateFood(
      type === 'photo'
        ? { type: 'photo', image: body.image, text }
        : { type: 'text', text: String(text) },
      {
        searchLocal: (q) => searchLocalKnowledge(q, records),
        provider: new USDAFoodDataProvider(),
        foodAi: new GeminiFoodAIProvider(),
        store: new PostgresAiStore(),
        requireProviderConfig: true,
      }
    );
    if (result.status === 'error') {
      console.error('Estimate failed:', result.code, result.message);
    }
    res.status(result.status === 'error' ? (result.code === 'budget_exhausted' ? 503 : 502) : 200).json(result);
  } catch (error) {
    console.error('Error estimating food:', error);
    res.status(502).json({
      status: 'error',
      code: 'provider_unavailable',
      message: "Couldn't estimate this food.",
      fallback: 'manual',
    });
  }
}
