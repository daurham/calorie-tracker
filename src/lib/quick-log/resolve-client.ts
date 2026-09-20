import type { QuickLogResolveRequest, ResolveOutcome } from '../../types/quick-log-resolve.js';

export async function resolveQuickLogRequest(text: string): Promise<ResolveOutcome> {
  const payload: QuickLogResolveRequest = {
    input: { type: 'text', text },
  };
  const response = await fetch('/api/quick-log/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({ error: response.statusText }));
  if (!response.ok) {
    throw new Error("Couldn't search reference nutrition.");
  }
  return data as ResolveOutcome;
}
