export type QuantityUnitKind = 'serving' | 'weight' | 'volume';

export interface ParsedQuantity {
  quantity: number;
  unit: string | null;
  unitKind: QuantityUnitKind;
  foodQuery: string;
  raw: string;
  canScaleByServing: boolean;
}

const WORD_QUANTITIES: Record<string, number> = {
  half: 0.5,
  quarter: 0.25,
  one: 1,
  two: 2,
  three: 3,
};

const WEIGHT_UNITS: Record<string, string> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
};

const VOLUME_UNITS: Record<string, string> = {
  cup: 'cup',
  cups: 'cup',
};

const parseLeadingNumber = (value: string): number | null => {
  if (WORD_QUANTITIES[value]) return WORD_QUANTITIES[value];
  if (value === '1/2') return 0.5;
  if (value === '1/4') return 0.25;
  if (value === '3/4') return 0.75;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const parseQuantityQuery = (input: string): ParsedQuantity => {
  const raw = input.trim();
  if (!raw) {
    return {
      quantity: 1,
      unit: null,
      unitKind: 'serving',
      foodQuery: '',
      raw,
      canScaleByServing: true,
    };
  }

  const weightMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(g|grams?|oz|ounces?)\s+(.+)$/i);
  if (weightMatch) {
    return {
      quantity: Number(weightMatch[1]),
      unit: WEIGHT_UNITS[weightMatch[2].toLowerCase()] || weightMatch[2].toLowerCase(),
      unitKind: 'weight',
      foodQuery: weightMatch[3].trim(),
      raw,
      canScaleByServing: false,
    };
  }

  const volumeMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(cups?)\s+(.+)$/i);
  if (volumeMatch) {
    return {
      quantity: Number(volumeMatch[1]),
      unit: VOLUME_UNITS[volumeMatch[2].toLowerCase()] || 'cup',
      unitKind: 'volume',
      foodQuery: volumeMatch[3].trim(),
      raw,
      canScaleByServing: false,
    };
  }

  const wordMatch = raw.match(/^(half|quarter|one|two|three|1\/2|1\/4|3\/4)\s+(?:x\s+)?(.+)$/i);
  if (wordMatch) {
    return {
      quantity: parseLeadingNumber(wordMatch[1].toLowerCase()) || 1,
      unit: null,
      unitKind: 'serving',
      foodQuery: wordMatch[2].trim(),
      raw,
      canScaleByServing: true,
    };
  }

  const servingMatch = raw.match(/^(\d+(?:\.\d+)?)\s+(?:x\s+)?(.+)$/i);
  if (servingMatch && parseLeadingNumber(servingMatch[1]) != null) {
    return {
      quantity: Number(servingMatch[1]),
      unit: null,
      unitKind: 'serving',
      foodQuery: servingMatch[2].trim(),
      raw,
      canScaleByServing: true,
    };
  }

  return {
    quantity: 1,
    unit: null,
    unitKind: 'serving',
    foodQuery: raw,
    raw,
    canScaleByServing: true,
  };
};
