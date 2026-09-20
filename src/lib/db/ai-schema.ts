export const AI_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS ai_usage (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    estimated_cost_usd DECIMAL(10,6) NOT NULL,
    success BOOLEAN NOT NULL,
    cached BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON ai_usage (created_at, cached, success)`,
  `CREATE TABLE IF NOT EXISTS ai_cache (
    id SERIAL PRIMARY KEY,
    request_hash VARCHAR(64) UNIQUE NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    response JSONB NOT NULL,
    provider VARCHAR(50),
    model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
  )`,
];
