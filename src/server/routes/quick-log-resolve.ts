import { loadPersonalSearchRecords } from '../../lib/food-search/load-personal.js';
import { searchLocalKnowledge } from '../../lib/food-search/search.js';
import { USDAFoodDataProvider } from '../../lib/nutrition-providers/index.js';
import { parseQuantityQuery, resolveQuickLog } from '../../lib/quick-log/index.js';

export async function handleQuickLogResolve(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const text = req.body?.input?.text ?? req.body?.text;
  if (!text || !String(text).trim()) {
    res.status(400).json({ error: 'input.text is required' });
    return;
  }

  try {
    const parsed = parseQuantityQuery(String(text));
    const records = await loadPersonalSearchRecords(parsed.foodQuery || String(text));
    const result = await resolveQuickLog(
      { input: { type: 'text', text: String(text) } },
      {
        searchLocal: (query) => searchLocalKnowledge(query, records),
        provider: new USDAFoodDataProvider(),
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error resolving quick log:', error);
    res.status(200).json({
      status: 'unresolved',
      classification: 'none',
      results: [],
      usedUsda: false,
      error: 'local_error',
      message: "Couldn't search reference nutrition.",
    });
  }
}
