import { GeminiFoodAIProvider } from '../../lib/food-ai/gemini-label.js';
import { handleExtractNutritionLabel } from '../../lib/food-ai/extract.js';
import { PostgresAiStore } from '../../lib/ai-infra/postgres-store.js';

const clientKeyFrom = (req: any) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]);
  return req.socket?.remoteAddress || req.headers?.['x-real-ip'] || 'anonymous';
};

export async function handleNutritionLabelExtract(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const result = await handleExtractNutritionLabel(
    {
      image: req.body?.image,
      barcode: req.body?.barcode ?? null,
      clientKey: clientKeyFrom(req),
    },
    {
      provider: new GeminiFoodAIProvider(),
      store: new PostgresAiStore(),
      requireProviderConfig: true,
    }
  );

  res.status(result.status).json(result.body);
}
