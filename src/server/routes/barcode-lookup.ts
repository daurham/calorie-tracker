import { findFoodByBarcode } from '../../lib/packaged-foods/db.js';
import { lookupBarcode } from '../../lib/packaged-foods/lookup.js';
import { OpenFoodFactsProvider } from '../../lib/packaged-foods/off-provider.js';

export async function handleBarcodeLookup(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const barcode = req.body?.barcode ?? req.body?.code;
  if (!barcode || !String(barcode).trim()) {
    res.status(400).json({ error: 'barcode is required' });
    return;
  }

  try {
    const result = await lookupBarcode(String(barcode), {
      local: { findByBarcode: findFoodByBarcode },
      provider: new OpenFoodFactsProvider(),
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error looking up barcode:', error);
    res.status(200).json({
      status: 'provider_error',
      barcode: String(barcode),
      source: 'none',
      usedOpenFoodFacts: false,
      product: null,
      message: 'Barcode lookup failed.',
    });
  }
}
