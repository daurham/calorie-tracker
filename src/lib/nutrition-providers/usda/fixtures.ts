import type { NutritionCandidate } from '../../../types/nutrition-provider';

export const usdaBanana: NutritionCandidate = {
  provider: 'usda',
  externalId: '173944',
  name: 'Bananas, raw',
  nutritionPer100g: { calories: 89, protein: 1.09, carbs: 22.84, fat: 0.33 },
  portions: [
    { description: '1 medium (7" to 7-7/8" long)', amount: 1, unit: 'medium', gramWeight: 118 },
    { description: '1 extra small (less than 6" long)', amount: 1, unit: 'small', gramWeight: 81 },
  ],
  metadata: { dataType: 'SR Legacy', description: 'Bananas, raw' },
};

export const usdaBananaBread: NutritionCandidate = {
  provider: 'usda',
  externalId: '999001',
  name: 'Banana bread, homemade',
  nutritionPer100g: { calories: 326, protein: 4.3, carbs: 54, fat: 10.5 },
  portions: [{ description: '1 slice', amount: 1, unit: 'slice', gramWeight: 60 }],
  metadata: { dataType: 'SR Legacy', description: 'Banana bread, homemade' },
};

export const usdaBrandedBananaYogurt: NutritionCandidate = {
  provider: 'usda',
  externalId: '999002',
  name: 'BANANA CREAM YOGURT',
  nutritionPer100g: { calories: 110, protein: 4, carbs: 18, fat: 2 },
  portions: [{ description: '1 container', amount: 1, unit: 'container', gramWeight: 150 }],
  metadata: { dataType: 'Branded', brandOwner: 'Some Brand', description: 'BANANA CREAM YOGURT' },
};

export const usdaStrawberries: NutritionCandidate = {
  provider: 'usda',
  externalId: '167762',
  name: 'Strawberries, raw',
  nutritionPer100g: { calories: 32, protein: 0.67, carbs: 7.68, fat: 0.3 },
  portions: [{ description: '1 cup, halves', amount: 1, unit: 'cup', gramWeight: 152 }],
  metadata: { dataType: 'Foundation', description: 'Strawberries, raw' },
};

export const usdaChickenGrilled: NutritionCandidate = {
  provider: 'usda',
  externalId: '171477',
  name: 'Chicken, broilers or fryers, breast, meat only, cooked, grilled',
  nutritionPer100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  portions: [{ description: '1 piece', amount: 1, unit: 'piece', gramWeight: 85 }],
  metadata: { dataType: 'SR Legacy', description: 'Chicken, broilers or fryers, breast, meat only, cooked, grilled' },
};

export const usdaChickenFried: NutritionCandidate = {
  provider: 'usda',
  externalId: '171478',
  name: 'Chicken, broilers or fryers, breast, meat only, cooked, fried',
  nutritionPer100g: { calories: 220, protein: 28, carbs: 8, fat: 8.9 },
  portions: [{ description: '1 piece', amount: 1, unit: 'piece', gramWeight: 85 }],
  metadata: { dataType: 'SR Legacy', description: 'Chicken, broilers or fryers, breast, meat only, cooked, fried' },
};

export const usdaRiceCooked: NutritionCandidate = {
  provider: 'usda',
  externalId: '168878',
  name: 'Rice, white, long-grain, regular, cooked',
  nutritionPer100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  portions: [{ description: '1 cup', amount: 1, unit: 'cup', gramWeight: 158 }],
  metadata: { dataType: 'SR Legacy', description: 'Rice, white, long-grain, regular, cooked' },
};

export const usdaRiceDry: NutritionCandidate = {
  provider: 'usda',
  externalId: '168877',
  name: 'Rice, white, long-grain, regular, raw, unenriched',
  nutritionPer100g: { calories: 365, protein: 7.1, carbs: 80, fat: 0.7 },
  portions: [{ description: '1 cup', amount: 1, unit: 'cup', gramWeight: 185 }],
  metadata: { dataType: 'SR Legacy', description: 'Rice, white, long-grain, regular, raw, unenriched' },
};

export const usdaTamale: NutritionCandidate = {
  provider: 'usda',
  externalId: '170000',
  name: 'Tamales, pork',
  nutritionPer100g: { calories: 270, protein: 10.4, carbs: 29.6, fat: 12.2 },
  portions: [{ description: '1 tamale', amount: 1, unit: 'tamale', gramWeight: 115 }],
  metadata: { dataType: 'SR Legacy', description: 'Tamales, pork' },
};

export const usdaKimchi: NutritionCandidate = {
  provider: 'usda',
  externalId: '170001',
  name: 'Kimchi',
  nutritionPer100g: { calories: 15, protein: 1.1, carbs: 2.4, fat: 0.5 },
  portions: [{ description: '1 cup', amount: 1, unit: 'cup', gramWeight: 150 }],
  metadata: { dataType: 'SR Legacy', description: 'Kimchi' },
};

export const usdaIncomplete: NutritionCandidate = {
  provider: 'usda',
  externalId: '1',
  name: 'Mystery fruit',
  nutritionPer100g: { calories: 50, protein: null, carbs: null, fat: null },
  portions: [],
  metadata: { dataType: 'SR Legacy', description: 'Mystery fruit' },
};
