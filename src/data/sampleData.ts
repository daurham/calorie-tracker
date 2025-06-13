
export const availableIngredients = [
  { id: 1, name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "100g" },
  { id: 2, name: "Brown Rice", calories: 112, protein: 2.6, carbs: 23, fat: 0.9, unit: "100g" },
  { id: 3, name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, unit: "100g" },
  { id: 4, name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, unit: "100g" },
  { id: 5, name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: "100g" },
  { id: 6, name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: "100g" },
  { id: 7, name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, unit: "100g" },
  { id: 8, name: "Greek Yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: "100g" },
  { id: 9, name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, unit: "100g" },
  { id: 10, name: "Quinoa", calories: 120, protein: 4.4, carbs: 22, fat: 1.9, unit: "100g" },
  { id: 11, name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11, unit: "100g" },
  { id: 12, name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "100g" },
  { id: 13, name: "Oats", calories: 389, protein: 17, carbs: 66, fat: 7, unit: "100g" },
  { id: 14, name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, unit: "100g" },
  { id: 15, name: "Tuna", calories: 144, protein: 30, carbs: 0, fat: 1, unit: "100g" },
];

export const sampleMealCombos = [
  {
    id: 1,
    name: "Protein Power Bowl",
    ingredients: ["Chicken Breast", "Brown Rice", "Broccoli"],
    calories: 311,
    protein: 36.4,
    carbs: 30,
    fat: 4.9,
    notes: "Perfect post-workout meal",
    instructions: "Grill chicken, steam broccoli, cook rice separately"
  },
  {
    id: 2,
    name: "Salmon Supreme",
    ingredients: ["Salmon", "Sweet Potato", "Spinach"],
    calories: 317,
    protein: 24.5,
    carbs: 26.6,
    fat: 13.5,
    notes: "Rich in omega-3s",
    instructions: "Bake salmon at 400°F, roast sweet potato, sauté spinach"
  },
  {
    id: 3,
    name: "Mediterranean Delight",
    ingredients: ["Greek Yogurt", "Almonds", "Blueberries"],
    calories: 296,
    protein: 31.7,
    carbs: 39.6,
    fat: 50.7,
    notes: "Great for breakfast or snack",
    instructions: "Mix yogurt with berries, top with crushed almonds"
  },
  {
    id: 4,
    name: "Quinoa Veggie Mix",
    ingredients: ["Quinoa", "Avocado", "Spinach"],
    calories: 303,
    protein: 7.3,
    carbs: 34.6,
    fat: 16.3,
    notes: "Vegan-friendly option",
    instructions: "Cook quinoa, mix with fresh spinach and diced avocado"
  },
  {
    id: 5,
    name: "Breakfast Champion",
    ingredients: ["Oats", "Banana", "Greek Yogurt"],
    calories: 537,
    protein: 21.1,
    carbs: 92.6,
    fat: 7.4,
    notes: "Energy-packed morning meal",
    instructions: "Cook oats, top with sliced banana and yogurt"
  },
  {
    id: 6,
    name: "Tuna Power Plate",
    ingredients: ["Tuna", "Sweet Potato", "Broccoli"],
    calories: 264,
    protein: 33.8,
    carbs: 27,
    fat: 1.4,
    notes: "Low-fat, high-protein option",
    instructions: "Grill tuna, bake sweet potato, steam broccoli"
  }
];
