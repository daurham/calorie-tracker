import { loadPersonalSearchRecords } from '../../src/lib/food-search/load-personal';
import { searchLocalKnowledge } from '../../src/lib/food-search/search';
import { USDAFoodDataProvider } from '../../src/lib/nutrition-providers';
import { GeminiFoodAIProvider } from '../../src/lib/food-ai/gemini-label';
import { PostgresAiStore } from '../../src/lib/ai-infra/postgres-store';
import { estimateFood } from '../../src/lib/food-estimate/estimate';
import { parseQuantityQuery } from '../../src/lib/quick-log';

export default async function handler(req: any, res: any) {
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
