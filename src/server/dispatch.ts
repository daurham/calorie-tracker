export type ApiRequest = {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, unknown>;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => unknown;
  end: (body?: unknown) => unknown;
  setHeader: (name: string, value: string | string[]) => unknown;
};

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<unknown> | unknown;

const ROUTE_LOADERS: Record<string, () => Promise<ApiHandler>> = {
  '/ai-recommend-meals': () =>
    import('./routes/ai-recommend-meals.js').then((module) => module.handleAiRecommendMeals),
  '/ai/usage': () => import('./routes/ai-usage.js').then((module) => module.handleAiUsage),
  '/analyze-food': () => import('./routes/analyze-food.js').then((module) => module.handleAnalyzeFood),
  '/analyze-ingredient': () =>
    import('./routes/analyze-ingredient.js').then((module) => module.handleAnalyzeIngredient),
  '/barcode/lookup': () => import('./routes/barcode-lookup.js').then((module) => module.handleBarcodeLookup),
  '/food-logs': () => import('./routes/food-logs.js').then((module) => module.handleFoodLogs),
  '/foods/search': () => import('./routes/foods-search.js').then((module) => module.handleFoodSearch),
  '/generate-meal-plan': () =>
    import('./routes/generate-meal-plan.js').then((module) => module.handleGenerateMealPlan),
  '/get-data': () => import('./routes/get-data.js').then((module) => module.handleGetData),
  '/ingredients': () => import('./routes/ingredients.js').then((module) => module.handleIngredients),
  '/meal-combos': () => import('./routes/meal-combos.js').then((module) => module.handleMealCombos),
  '/nutrition-label/extract': () =>
    import('./routes/nutrition-label-extract.js').then((module) => module.handleNutritionLabelExtract),
  '/packaged-foods/save': () =>
    import('./routes/packaged-food-save.js').then((module) => module.handlePackagedFoodSave),
  '/quick-log/estimate': () =>
    import('./routes/quick-log-estimate.js').then((module) => module.handleQuickLogEstimate),
  '/quick-log/resolve': () =>
    import('./routes/quick-log-resolve.js').then((module) => module.handleQuickLogResolve),
};

export const API_ROUTES = Object.freeze({ ...ROUTE_LOADERS });

function firstValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstValue(value[0]);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function headerValue(req: ApiRequest, name: string): string | undefined {
  const headers = req.headers || {};
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return firstValue(value);
  }
  return undefined;
}

export function normalizeRoute(path: string): string {
  const withoutQuery = String(path || '').split('?')[0];
  let route = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1);
  }
  return route;
}

export function resolveLogicalRoute(req: ApiRequest): string {
  const fromRewrite = firstValue(req.query?.__route);
  if (fromRewrite) {
    return normalizeRoute(fromRewrite);
  }

  const urlPath = normalizeRoute((req.url || '').split('?')[0]);
  if (urlPath.startsWith('/api/') && urlPath !== '/api/index') {
    return normalizeRoute(urlPath.slice('/api'.length));
  }

  const forwarded = headerValue(req, 'x-forwarded-uri') || headerValue(req, 'x-invoke-path');
  if (forwarded) {
    const forwardedPath = normalizeRoute(forwarded.split('?')[0]);
    if (forwardedPath.startsWith('/api/') && forwardedPath !== '/api/index') {
      return normalizeRoute(forwardedPath.slice('/api'.length));
    }
  }

  return '';
}

export function createDispatcher(routes: Record<string, ApiHandler>) {
  return async function dispatch(req: ApiRequest, res: ApiResponse) {
    const route = resolveLogicalRoute(req);
    const handler = Object.prototype.hasOwnProperty.call(routes, route)
      ? routes[route]
      : undefined;

    if (!handler) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    await handler(req, res);
  };
}

export async function dispatch(req: ApiRequest, res: ApiResponse) {
  const route = resolveLogicalRoute(req);
  const load = Object.prototype.hasOwnProperty.call(ROUTE_LOADERS, route)
    ? ROUTE_LOADERS[route]
    : undefined;

  if (!load) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const handler = await load();
  await handler(req, res);
}
