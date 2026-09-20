import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatch } from '../src/server/dispatch';

// Single Hobby-plan Serverless Function. Public /api/* URLs are rewritten here.
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await dispatch(req, res);
}
