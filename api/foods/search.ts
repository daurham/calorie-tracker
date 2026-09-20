import { FOODS_SCHEMA_STATEMENTS } from '../../src/lib/db/foods-schema';
import { loadPersonalSearchRecords } from '../../src/lib/food-search/load-personal';
import { searchLocalKnowledge } from '../../src/lib/food-search/search';
import { sql } from '@vercel/postgres';

let tablesReady = false;

async function ensureFoodsTable() {
  if (tablesReady) return;
  for (const statement of FOODS_SCHEMA_STATEMENTS) {
    await sql.query(statement);
  }
  tablesReady = true;
}

export default async function handler(req: any, res: any) {
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
