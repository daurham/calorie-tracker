import { FOODS_SCHEMA_STATEMENTS } from '../../lib/db/foods-schema.js';
import { loadPersonalSearchRecords } from '../../lib/food-search/load-personal.js';
import { searchLocalKnowledge } from '../../lib/food-search/search.js';
import { sql } from '@vercel/postgres';

let tablesReady = false;

async function ensureFoodsTable() {
  if (tablesReady) return;
  for (const statement of FOODS_SCHEMA_STATEMENTS) {
    await sql.query(statement);
  }
  tablesReady = true;
}

export async function handleFoodSearch(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const query = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  if (!query || !String(query).trim()) {
    res.status(200).json({ query: query || '', classification: 'none', results: [] });
    return;
  }

  try {
    await ensureFoodsTable();
    const records = await loadPersonalSearchRecords(String(query));
    res.status(200).json(searchLocalKnowledge(String(query), records));
  } catch (error) {
    console.error('Error searching local foods:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to search foods',
    });
  }
}
