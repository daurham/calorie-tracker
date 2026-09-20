export const FOODS_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    food_type VARCHAR(30) NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(7,2),
    carbs DECIMAL(7,2),
    fat DECIMAL(7,2),
    serving_amount DECIMAL(8,2),
    serving_unit VARCHAR(50),
    weight_grams DECIMAL(8,2),
    source_type VARCHAR(30) NOT NULL,
    source_external_id VARCHAR(255),
    confidence VARCHAR(20),
    calorie_low INTEGER,
    calorie_high INTEGER,
    attributes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_foods_normalized_name ON foods(normalized_name)`,
  `CREATE INDEX IF NOT EXISTS idx_foods_last_used ON foods(last_used_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_source_external_id
     ON foods (source_external_id)
     WHERE source_external_id IS NOT NULL`,
];
