import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  API_ROUTES,
  createDispatcher,
  dispatch,
  normalizeRoute,
  resolveLogicalRoute,
  type ApiHandler,
  type ApiRequest,
  type ApiResponse,
} from './dispatch';
import { handleAiUsage } from './routes/ai-usage';
import { handleBarcodeLookup } from './routes/barcode-lookup';
import { handleFoodSearch } from './routes/foods-search';
import { handleNutritionLabelExtract } from './routes/nutrition-label-extract';
import { handlePackagedFoodSave } from './routes/packaged-food-save';
import { handleQuickLogEstimate } from './routes/quick-log-estimate';
import { handleQuickLogResolve } from './routes/quick-log-resolve';
import { handleAnalyzeFood } from './routes/analyze-food.js';
import { handleAnalyzeIngredient } from './routes/analyze-ingredient.js';
import { handleGenerateMealPlan } from './routes/generate-meal-plan.js';

function createMockRes() {
  const result: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string | string[]>;
    ended: boolean;
  } = {
    statusCode: 200,
    body: undefined,
    headers: {},
    ended: false,
  };

  const res: ApiResponse = {
    status(code: number) {
      result.statusCode = code;
      return res;
    },
    json(body: unknown) {
      result.body = body;
      result.ended = true;
      return res;
    },
    end(body?: unknown) {
      if (body !== undefined) result.body = body;
      result.ended = true;
      return res;
    },
    setHeader(name: string, value: string | string[]) {
      result.headers[name] = value;
      return res;
    },
  };

  return { res, result };
}

function spyHandler(name: string): { handler: ApiHandler; calls: ApiRequest[] } {
  const calls: ApiRequest[] = [];
  return {
    calls,
    handler: async (req) => {
      calls.push(req);
    },
  };
}

const LIVE_ROUTES = [
  '/ai-recommend-meals',
  '/ai/usage',
  '/analyze-food',
  '/analyze-ingredient',
  '/barcode/lookup',
  '/food-logs',
  '/foods/search',
  '/generate-meal-plan',
  '/get-data',
  '/ingredients',
  '/meal-combos',
  '/nutrition-label/extract',
  '/packaged-foods/save',
  '/quick-log/estimate',
  '/quick-log/resolve',
] as const;

describe('API dispatcher registry', () => {
  it('registers every live API route exactly once', () => {
    assert.deepEqual(Object.keys(API_ROUTES).sort(), [...LIVE_ROUTES].sort());
  });

  it('loads handlers from a fixed registry rather than the request path', async () => {
    const loader = API_ROUTES['/food-logs'];
    assert.equal(typeof loader, 'function');
    const handler = await loader();
    assert.equal(typeof handler, 'function');
  });

  it('does not resolve routes from user-controlled module paths', () => {
    assert.equal(API_ROUTES['/../package.json'], undefined);
    assert.equal(API_ROUTES['/food-logs/../../scripts/init-db'], undefined);
  });
});

describe('resolveLogicalRoute', () => {
  it('uses the rewrite __route query when present', () => {
    assert.equal(
      resolveLogicalRoute({ url: '/api?__route=/foods/search', query: { __route: '/foods/search', q: 'banana' } }),
      '/foods/search'
    );
  });

  it('reads the original /api path from req.url', () => {
    assert.equal(
      resolveLogicalRoute({ url: '/api/food-logs?resource=group&id=abc' }),
      '/food-logs'
    );
  });

  it('normalizes trailing slashes', () => {
    assert.equal(normalizeRoute('/foods/search/'), '/foods/search');
  });
});

describe('dispatch routing', () => {
  const spies = Object.fromEntries(LIVE_ROUTES.map((route) => [route, spyHandler(route)]));
  const routes = Object.fromEntries(
    LIVE_ROUTES.map((route) => [route, spies[route].handler])
  ) as Record<string, ApiHandler>;
  const testDispatch = createDispatcher(routes);

  async function routed(req: ApiRequest) {
    Object.values(spies).forEach((spy) => {
      spy.calls.length = 0;
    });
    const { res, result } = createMockRes();
    await testDispatch(req, res);
    const hit = LIVE_ROUTES.filter((route) => spies[route].calls.length > 0);
    return { hit, result, req: spies[hit[0]]?.calls[0] };
  }

  it('routes /food-logs', async () => {
    const { hit } = await routed({ url: '/api/food-logs', query: { __route: '/food-logs' } });
    assert.deepEqual(hit, ['/food-logs']);
  });

  it('routes /foods/search?q=banana and preserves q', async () => {
    const { hit, req } = await routed({
      method: 'GET',
      url: '/api/foods/search?q=banana',
      query: { __route: '/foods/search', q: 'banana' },
    });
    assert.deepEqual(hit, ['/foods/search']);
    assert.equal(req?.query?.q, 'banana');
  });

  it('routes /quick-log/resolve', async () => {
    const { hit } = await routed({
      method: 'POST',
      url: '/api/quick-log/resolve',
      query: { __route: '/quick-log/resolve' },
    });
    assert.deepEqual(hit, ['/quick-log/resolve']);
  });

  it('routes /quick-log/estimate', async () => {
    const { hit } = await routed({
      method: 'POST',
      url: '/api/quick-log/estimate',
      query: { __route: '/quick-log/estimate' },
    });
    assert.deepEqual(hit, ['/quick-log/estimate']);
  });

  it('routes /barcode/lookup', async () => {
    const { hit } = await routed({
      method: 'POST',
      url: '/api/barcode/lookup',
      query: { __route: '/barcode/lookup' },
    });
    assert.deepEqual(hit, ['/barcode/lookup']);
  });

  it('routes /packaged-foods/save', async () => {
    const { hit } = await routed({
      method: 'POST',
      url: '/api/packaged-foods/save',
      query: { __route: '/packaged-foods/save' },
    });
    assert.deepEqual(hit, ['/packaged-foods/save']);
  });

  it('routes /nutrition-label/extract', async () => {
    const { hit } = await routed({
      method: 'POST',
      url: '/api/nutrition-label/extract',
      query: { __route: '/nutrition-label/extract' },
    });
    assert.deepEqual(hit, ['/nutrition-label/extract']);
  });

  it('routes /ai/usage', async () => {
    const { hit } = await routed({
      method: 'GET',
      url: '/api/ai/usage',
      query: { __route: '/ai/usage' },
    });
    assert.deepEqual(hit, ['/ai/usage']);
  });

  it('routes remaining live endpoints', async () => {
    const extra = [
      '/ingredients',
      '/meal-combos',
      '/analyze-food',
      '/analyze-ingredient',
      '/ai-recommend-meals',
      '/generate-meal-plan',
      '/get-data',
    ] as const;

    for (const route of extra) {
      const { hit } = await routed({
        url: `/api${route}`,
        query: { __route: route },
      });
      assert.deepEqual(hit, [route], `expected ${route}`);
    }
  });

  it('returns a clean API 404 for unknown routes', async () => {
    const { hit, result } = await routed({
      url: '/api/does-not-exist',
      query: { __route: '/does-not-exist' },
    });
    assert.deepEqual(hit, []);
    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, { error: 'Not found' });
  });

  it('preserves grouped DELETE query parameters', async () => {
    const { hit, req } = await routed({
      method: 'DELETE',
      url: '/api/food-logs?resource=group&id=group-1&logIds=1,2',
      query: { __route: '/food-logs', resource: 'group', id: 'group-1', logIds: '1,2' },
    });
    assert.deepEqual(hit, ['/food-logs']);
    assert.equal(req?.query?.resource, 'group');
    assert.equal(req?.query?.id, 'group-1');
    assert.equal(req?.query?.logIds, '1,2');
  });

  it('passes image bodies through without mutation', async () => {
    const image = {
      mimeType: 'image/jpeg',
      dataBase64: 'aGVsbG8td29ybGQ=',
    };
    const body = { image, barcode: '0123456789012' };
    const { hit, req } = await routed({
      method: 'POST',
      url: '/api/nutrition-label/extract',
      query: { __route: '/nutrition-label/extract' },
      body,
    });
    assert.deepEqual(hit, ['/nutrition-label/extract']);
    assert.equal(req?.body, body);
    assert.equal((req?.body as { image: typeof image }).image, image);
    assert.equal((req?.body as { image: typeof image }).image.dataBase64, 'aGVsbG8td29ybGQ=');
  });
});

describe('existing handler HTTP methods', () => {
  async function call(handler: ApiHandler, req: ApiRequest) {
    const { res, result } = createMockRes();
    await handler(req, res);
    return result;
  }

  it('rejects unsupported methods with 405', async () => {
    const cases: Array<[string, ApiHandler]> = [
      ['POST', handleFoodSearch],
      ['GET', handleQuickLogResolve],
      ['GET', handleQuickLogEstimate],
      ['GET', handleBarcodeLookup],
      ['GET', handlePackagedFoodSave],
      ['GET', handleNutritionLabelExtract],
      ['POST', handleAiUsage],
      ['GET', handleAnalyzeFood],
      ['GET', handleAnalyzeIngredient],
      ['GET', handleGenerateMealPlan],
    ];

    for (const [method, handler] of cases) {
      const result = await call(handler, { method, query: {}, body: {}, headers: {} });
      assert.equal(result.statusCode, 405, `${handler.name} ${method}`);
    }
  });
});

describe('production dispatch entry', () => {
  it('uses the real registry for unknown routes', async () => {
    const { res, result } = createMockRes();
    await dispatch({ url: '/api/does-not-exist', query: { __route: '/does-not-exist' } }, res);
    assert.equal(result.statusCode, 404);
  });
});
