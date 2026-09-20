import { sql } from '@vercel/postgres';

const SOURCE_TYPES = [
  'ingredient',
  'meal_combo',
  'food',
  'historical_log',
  'quick_calories',
  'usda',
  'open_food_facts',
  'nutrition_label',
  'ai_estimate',
  'mod',
  'legacy',
];

const NUTRITION_SOURCES = [
  'user_entered',
  'legacy',
  'usda',
  'open_food_facts',
  'nutrition_label',
  'ai_reference',
  'ai_estimate',
  'catalog',
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS food_log_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(255),
    original_input TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS food_logs (
    id SERIAL PRIMARY KEY,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_id UUID REFERENCES food_log_groups(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(30) NOT NULL,
    source_id INTEGER,
    nutrition_source VARCHAR(30) NOT NULL,
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
    serving_description VARCHAR(100),
    weight_grams DECIMAL(8,2),
    calories INTEGER NOT NULL,
    protein DECIMAL(7,2),
    carbs DECIMAL(7,2),
    fat DECIMAL(7,2),
    confidence VARCHAR(20),
    calorie_low INTEGER,
    calorie_high INTEGER,
    original_input TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON food_logs(logged_at)`,
  `CREATE INDEX IF NOT EXISTS idx_food_logs_source ON food_logs(source_type, source_id)`,
  `CREATE INDEX IF NOT EXISTS idx_food_logs_group ON food_logs(group_id)`,
  `CREATE INDEX IF NOT EXISTS idx_food_logs_name ON food_logs(display_name)`,
];

let tablesReady = false;

async function ensureTables() {
  if (tablesReady) return;
  for (const statement of SCHEMA_STATEMENTS) {
    await sql.query(statement);
  }
  tablesReady = true;
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredCalories(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error('calories is required');
  }
  return Math.round(parsed);
}

function normalizeLog(row) {
  return {
    ...row,
    calories: Number(row.calories),
    protein: row.protein == null ? null : Number(row.protein),
    carbs: row.carbs == null ? null : Number(row.carbs),
    fat: row.fat == null ? null : Number(row.fat),
    quantity: row.quantity == null ? 1 : Number(row.quantity),
    weight_grams: row.weight_grams == null ? null : Number(row.weight_grams),
    calorie_low: row.calorie_low == null ? null : Number(row.calorie_low),
    calorie_high: row.calorie_high == null ? null : Number(row.calorie_high),
    source_id: row.source_id == null ? null : Number(row.source_id),
    metadata: row.metadata || {},
  };
}

function validateLogInput(input, { partial = false } = {}) {
  if (!partial || input.source_type !== undefined) {
    if (!SOURCE_TYPES.includes(input.source_type)) {
      throw new Error(`Invalid source_type: ${input.source_type}`);
    }
  }
  if (!partial || input.nutrition_source !== undefined) {
    if (!NUTRITION_SOURCES.includes(input.nutrition_source)) {
      throw new Error(`Invalid nutrition_source: ${input.nutrition_source}`);
    }
  }
  if (!partial && (input.display_name == null || String(input.display_name).trim() === '')) {
    throw new Error('display_name is required');
  }
}

function logInsertParams(input, groupId = null) {
  validateLogInput(input);
  return [
    input.logged_at || null,
    groupId ?? input.group_id ?? null,
    String(input.display_name).trim(),
    input.source_type,
    input.source_id ?? null,
    input.nutrition_source,
    nullableNumber(input.quantity) ?? 1,
    input.serving_description ?? null,
    nullableNumber(input.weight_grams),
    requiredCalories(input.calories),
    nullableNumber(input.protein),
    nullableNumber(input.carbs),
    nullableNumber(input.fat),
    input.confidence ?? null,
    nullableNumber(input.calorie_low),
    nullableNumber(input.calorie_high),
    input.original_input ?? null,
    JSON.stringify(input.metadata || {}),
  ];
}

async function insertFoodLogs(inputs, groupId = null) {
  if (inputs.length === 0) return [];

  const params = [];
  const valueSql = inputs.map((input, index) => {
    const offset = index * 18;
    params.push(...logInsertParams(input, groupId));
    return `(
      COALESCE($${offset + 1}::timestamptz, CURRENT_TIMESTAMP), $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6},
      COALESCE($${offset + 7}, 1), $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13},
      $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, COALESCE($${offset + 18}, '{}'::jsonb)
    )`;
  });

  const result = await sql.query(
    `INSERT INTO food_logs (
      logged_at, group_id, display_name, source_type, source_id, nutrition_source,
      quantity, serving_description, weight_grams, calories, protein, carbs, fat,
      confidence, calorie_low, calorie_high, original_input, metadata
    ) VALUES ${valueSql.join(', ')}
    RETURNING *`,
    params
  );
  return result.rows.map(normalizeLog);
}

async function getFoodLogs(req, res) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (id) {
    const result = await sql.query('SELECT * FROM food_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Food log not found' });
      return;
    }
    res.status(200).json(normalizeLog(result.rows[0]));
    return;
  }

  const recent = Array.isArray(req.query.recent) ? req.query.recent[0] : req.query.recent;
  if (recent != null && recent !== '') {
    const parsedLimit = Number.parseInt(String(recent), 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
    const logsResult = await sql.query(
      `SELECT * FROM food_logs
       ORDER BY logged_at DESC, id DESC
       LIMIT $1`,
      [limit]
    );
    res.status(200).json({
      logs: logsResult.rows.map(normalizeLog),
      groups: [],
    });
    return;
  }

  const from = Array.isArray(req.query.from) ? req.query.from[0] : req.query.from;
  const to = Array.isArray(req.query.to) ? req.query.to[0] : req.query.to;
  if (!from || !to) {
    res.status(400).json({ error: 'from and to query params are required' });
    return;
  }

  const logsResult = await sql.query(
    `SELECT * FROM food_logs
     WHERE logged_at >= $1 AND logged_at < $2
     ORDER BY logged_at ASC, id ASC`,
    [from, to]
  );
  const groupIds = [...new Set(logsResult.rows.map((row) => row.group_id).filter(Boolean))];
  let groups = [];
  if (groupIds.length > 0) {
    const groupsResult = await sql.query(
      'SELECT * FROM food_log_groups WHERE id = ANY($1::uuid[])',
      [groupIds]
    );
    groups = groupsResult.rows;
  }

  res.status(200).json({
    logs: logsResult.rows.map(normalizeLog),
    groups,
  });
}

async function createGroup(body) {
  const result = await sql.query(
    `INSERT INTO food_log_groups (id, display_name, original_input)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3)
     RETURNING *`,
    [body.id || null, body.display_name ?? null, body.original_input ?? null]
  );
  return result.rows[0];
}

async function createFoodLogs(req, res) {
  const resource = Array.isArray(req.query.resource) ? req.query.resource[0] : req.query.resource;
  if (resource === 'group') {
    const group = await createGroup(req.body || {});
    res.status(201).json(group);
    return;
  }

  const body = req.body || {};
  const logs = Array.isArray(body.logs) ? body.logs : body.display_name ? [body] : [];
  if (logs.length === 0) {
    res.status(400).json({ error: 'At least one food log is required' });
    return;
  }

  await sql.query('BEGIN');
  try {
    let group = null;
    if (body.group) {
      group = await createGroup(body.group);
    }

    const created = await insertFoodLogs(logs, group?.id ?? null);

    await sql.query('COMMIT');
    res.status(201).json({
      logs: created,
      groups: group ? [group] : [],
    });
  } catch (error) {
    await sql.query('ROLLBACK');
    throw error;
  }
}

async function updateFoodLog(req, res) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    res.status(400).json({ error: 'ID is required' });
    return;
  }

  const existing = await sql.query('SELECT * FROM food_logs WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    res.status(404).json({ error: 'Food log not found' });
    return;
  }

  const input = req.body || {};
  validateLogInput({
    ...existing.rows[0],
    ...input,
  }, { partial: true });

  const current = existing.rows[0];
  const next = {
    logged_at: input.logged_at ?? current.logged_at,
    group_id: input.group_id === undefined ? current.group_id : input.group_id,
    display_name: input.display_name ?? current.display_name,
    source_type: input.source_type ?? current.source_type,
    source_id: input.source_id === undefined ? current.source_id : input.source_id,
    nutrition_source: input.nutrition_source ?? current.nutrition_source,
    quantity: input.quantity === undefined ? current.quantity : input.quantity,
    serving_description: input.serving_description === undefined ? current.serving_description : input.serving_description,
    weight_grams: input.weight_grams === undefined ? current.weight_grams : input.weight_grams,
    calories: input.calories === undefined ? current.calories : requiredCalories(input.calories),
    protein: input.protein === undefined ? current.protein : nullableNumber(input.protein),
    carbs: input.carbs === undefined ? current.carbs : nullableNumber(input.carbs),
    fat: input.fat === undefined ? current.fat : nullableNumber(input.fat),
    confidence: input.confidence === undefined ? current.confidence : input.confidence,
    calorie_low: input.calorie_low === undefined ? current.calorie_low : nullableNumber(input.calorie_low),
    calorie_high: input.calorie_high === undefined ? current.calorie_high : nullableNumber(input.calorie_high),
    original_input: input.original_input === undefined ? current.original_input : input.original_input,
    metadata: input.metadata === undefined ? current.metadata : input.metadata,
  };

  const result = await sql.query(
    `UPDATE food_logs SET
      logged_at = $1,
      group_id = $2,
      display_name = $3,
      source_type = $4,
      source_id = $5,
      nutrition_source = $6,
      quantity = $7,
      serving_description = $8,
      weight_grams = $9,
      calories = $10,
      protein = $11,
      carbs = $12,
      fat = $13,
      confidence = $14,
      calorie_low = $15,
      calorie_high = $16,
      original_input = $17,
      metadata = COALESCE($18, '{}'::jsonb),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $19
     RETURNING *`,
    [
      next.logged_at,
      next.group_id,
      next.display_name,
      next.source_type,
      next.source_id,
      next.nutrition_source,
      next.quantity,
      next.serving_description,
      next.weight_grams,
      next.calories,
      next.protein,
      next.carbs,
      next.fat,
      next.confidence,
      next.calorie_low,
      next.calorie_high,
      next.original_input,
      JSON.stringify(next.metadata || {}),
      id,
    ]
  );

  res.status(200).json(normalizeLog(result.rows[0]));
}

async function deleteFoodLogs(req, res) {
  const resource = Array.isArray(req.query.resource) ? req.query.resource[0] : req.query.resource;
  if (resource === 'group') {
    const groupId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!groupId) {
      res.status(400).json({ error: 'group id is required' });
      return;
    }

    const bodyIds = Array.isArray(req.body?.logIds) ? req.body.logIds : [];
    const queryIds = String(req.query.logIds || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const requestedIds = [...bodyIds, ...queryIds]
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    if (requestedIds.length === 0) {
      res.status(400).json({ error: 'logIds are required so unrelated group members are not deleted' });
      return;
    }

    await sql.query('BEGIN');
    try {
      const members = await sql.query(
        'SELECT id, group_id FROM food_logs WHERE group_id = $1',
        [groupId]
      );
      const created = new Set(requestedIds);
      const logIdsToDelete = members.rows
        .filter((row) => created.has(Number(row.id)))
        .map((row) => Number(row.id));

      let deleted = [];
      if (logIdsToDelete.length > 0) {
        const deletedResult = await sql.query(
          'DELETE FROM food_logs WHERE group_id = $1 AND id = ANY($2::int[]) RETURNING *',
          [groupId, logIdsToDelete]
        );
        deleted = deletedResult.rows.map(normalizeLog);
      }

      const remaining = await sql.query(
        'SELECT id FROM food_logs WHERE group_id = $1',
        [groupId]
      );
      let groupDeleted = false;
      if (remaining.rows.length === 0) {
        const removedGroup = await sql.query(
          'DELETE FROM food_log_groups WHERE id = $1 RETURNING id',
          [groupId]
        );
        groupDeleted = removedGroup.rows.length > 0;
      }

      await sql.query('COMMIT');
      res.status(200).json({
        logs: deleted,
        groupDeleted,
        skippedLogIds: requestedIds.filter((id) => !logIdsToDelete.includes(id)),
      });
    } catch (error) {
      await sql.query('ROLLBACK');
      throw error;
    }
    return;
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (id) {
    const result = await sql.query('DELETE FROM food_logs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Food log not found' });
      return;
    }
    res.status(200).json(normalizeLog(result.rows[0]));
    return;
  }

  const from = Array.isArray(req.query.from) ? req.query.from[0] : req.query.from;
  const to = Array.isArray(req.query.to) ? req.query.to[0] : req.query.to;
  if (!from || !to) {
    res.status(400).json({ error: 'ID or from/to query params are required' });
    return;
  }

  const result = await sql.query(
    'DELETE FROM food_logs WHERE logged_at >= $1 AND logged_at < $2 RETURNING id',
    [from, to]
  );
  res.status(200).json({ deleted: result.rowCount || 0 });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await ensureTables();
  } catch (error) {
    console.error('Error ensuring food log tables:', error);
    res.status(500).json({ error: 'Failed to initialize food log tables' });
    return;
  }

  const methodHandlers = {
    GET: getFoodLogs,
    POST: createFoodLogs,
    PATCH: updateFoodLog,
    DELETE: deleteFoodLogs,
  };

  const handlerForMethod = methodHandlers[req.method];
  if (!handlerForMethod) {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    await handlerForMethod(req, res);
  } catch (error) {
    console.error('Error handling food logs request:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('required') || message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ error: message });
  }
}
