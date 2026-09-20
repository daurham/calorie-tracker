import type { IncomingMessage, ServerResponse } from 'node:http';
import { config as loadEnv } from 'dotenv';
import type { Plugin } from 'vite';

loadEnv();

function createDevResponse(res: ServerResponse) {
  const apiRes = {
    status(code: number) {
      res.statusCode = code;
      return apiRes;
    },
    json(body: unknown) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(body));
      return apiRes;
    },
    end(body?: unknown) {
      if (body === undefined) {
        res.end();
      } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
        res.end(body);
      } else {
        res.end(String(body));
      }
      return apiRes;
    },
    setHeader(name: string, value: string | string[]) {
      res.setHeader(name, value);
      return apiRes;
    },
  };
  return apiRes;
}

async function readBody(req: IncomingMessage) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return undefined;

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;

  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export function calorieTrackerApiDevPlugin(): Plugin {
  return {
    name: 'calorie-tracker-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api')) {
          next();
          return;
        }

        try {
          const { dispatch } = await server.ssrLoadModule('/src/server/dispatch.ts');
          const parsed = new URL(url, 'http://localhost');
          const query = Object.fromEntries(parsed.searchParams.entries());
          await dispatch(
            {
              method: req.method,
              url,
              query,
              body: await readBody(req),
              headers: req.headers,
            },
            createDevResponse(res),
          );
          if (!res.writableEnded) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Not found' }));
          }
        } catch (error) {
          if (res.headersSent) return;
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'API error',
          }));
        }
      });
    },
  };
}
