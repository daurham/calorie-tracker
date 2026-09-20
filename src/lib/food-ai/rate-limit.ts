export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

const buckets = new Map<string, number[]>();

export const LABEL_RATE_LIMIT = {
  maxRequests: 6,
  windowMs: 10 * 60 * 1000,
  maxImageBytes: 1_500_000,
};

export const checkRateLimit = (
  key: string,
  now = Date.now(),
  config = LABEL_RATE_LIMIT
): RateLimitDecision => {
  const cutoff = now - config.windowMs;
  const recent = (buckets.get(key) || []).filter(stamp => stamp > cutoff);
  if (recent.length >= config.maxRequests) {
    buckets.set(key, recent);
    const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + config.windowMs - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
};

export const resetRateLimit = (key?: string) => {
  if (key) buckets.delete(key);
  else buckets.clear();
};

export const estimateBase64Bytes = (dataBase64: string) =>
  Math.floor((dataBase64.replace(/\s/g, '').length * 3) / 4);
