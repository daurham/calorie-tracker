import type { PackagedFoodResult } from '../../types/packaged-food';

export const OFF_PROTEIN_BAR_PAYLOAD = {
  status: 1,
  product: {
    code: '0123456789012',
    product_name: 'Protein Bar',
    brands: 'Brand Name',
    serving_size: '1 bar (60 g)',
    serving_quantity: 60,
    nutriments: {
      'energy-kcal_100g': 350,
      proteins_100g: 33.3,
      carbohydrates_100g: 36.7,
      fat_100g: 11.7,
      'energy-kcal_serving': 210,
      proteins_serving: 20,
      carbohydrates_serving: 22,
      fat_serving: 7,
    },
  },
};

export const OFF_MISSING_SERVING_WEIGHT_PAYLOAD = {
  status: 1,
  product: {
    code: '0987654321098',
    product_name: 'Mystery Bar',
    brands: 'Unknown Co',
    serving_size: '1 bar',
    nutriments: {
      'energy-kcal_serving': 210,
      proteins_serving: 20,
      carbohydrates_serving: 22,
      fat_serving: 7,
    },
  },
};

export const OFF_MISSING_MACRO_PAYLOAD = {
  status: 1,
  product: {
    code: '1111111111111',
    product_name: 'Oil Spray',
    serving_size: '1 spray (0.5 g)',
    serving_quantity: 0.5,
    nutriments: {
      'energy-kcal_100g': 800,
      'energy-kcal_serving': 4,
      fat_100g: 91,
      fat_serving: 0.5,
    },
  },
};

export const OFF_NOT_FOUND_PAYLOAD = {
  status: 0,
  status_verbose: 'product not found',
  code: '0000000000000',
};

export const proteinBarProduct: PackagedFoodResult = {
  provider: 'open_food_facts',
  externalId: '0123456789012',
  barcode: '0123456789012',
  name: 'Protein Bar',
  brand: 'Brand Name',
  nutritionPer100g: { calories: 350, protein: 33.3, carbs: 36.7, fat: 11.7 },
  serving: { description: '1 bar (60 g)', amount: 1, unit: 'bar', gramWeight: 60 },
  nutritionPerServing: { calories: 210, protein: 20, carbs: 22, fat: 7 },
  selectedNutrition: { calories: 210, protein: 20, carbs: 22, fat: 7 },
  metadata: { provider: 'open_food_facts' },
};
