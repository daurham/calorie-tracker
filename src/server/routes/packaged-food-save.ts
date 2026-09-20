import { findFoodByBarcode, upsertCanonicalFood } from '../../lib/packaged-foods/db.js';
import { savePackagedFood } from '../../lib/packaged-foods/save.js';

export async function handlePackagedFoodSave(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const product = req.body?.product;
  const quantity = Number(req.body?.quantity ?? 1);
  if (!product?.name || !(product.selectedNutrition || product.nutritionPerServing)) {
    res.status(400).json({ error: 'A packaged product with nutrition is required' });
    return;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    res.status(400).json({ error: 'quantity must be greater than 0' });
    return;
  }

  try {
    const result = await savePackagedFood(product, quantity, {
      findByBarcode: findFoodByBarcode,
      upsert: upsertCanonicalFood,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error saving packaged food:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save packaged food',
    });
  }
}
