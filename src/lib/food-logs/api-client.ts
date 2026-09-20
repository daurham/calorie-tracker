import type {
  CreateFoodLogsRequest,
  FoodLog,
  FoodLogDateRange,
  FoodLogGroup,
  FoodLogInput,
  FoodLogsResponse,
} from '../../types/food-log';

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    throw new ApiError(
      errorData.message || errorData.error || `API error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

export async function getFoodLogs(range: FoodLogDateRange): Promise<FoodLogsResponse> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return fetchApi<FoodLogsResponse>(`/api/food-logs?${params.toString()}`);
}

export async function getRecentFoodLogs(limit = 80): Promise<FoodLogsResponse> {
  const params = new URLSearchParams({ recent: String(limit) });
  return fetchApi<FoodLogsResponse>(`/api/food-logs?${params.toString()}`);
}

export async function createFoodLogs(payload: CreateFoodLogsRequest): Promise<FoodLogsResponse> {
  return fetchApi<FoodLogsResponse>('/api/food-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createFoodLog(input: FoodLogInput): Promise<FoodLog> {
  const result = await createFoodLogs({ logs: [input] });
  return result.logs[0];
}

export async function updateFoodLog(id: number, input: Partial<FoodLogInput>): Promise<FoodLog> {
  return fetchApi<FoodLog>(`/api/food-logs?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteFoodLog(id: number): Promise<FoodLog> {
  return fetchApi<FoodLog>(`/api/food-logs?id=${id}`, {
    method: 'DELETE',
  });
}

export async function deleteFoodLogsInGroup(
  groupId: string,
  logIds: number[]
): Promise<{ logs: FoodLog[]; groupDeleted: boolean; skippedLogIds: number[] }> {
  const params = new URLSearchParams({
    resource: 'group',
    id: groupId,
    logIds: logIds.join(','),
  });
  return fetchApi<{ logs: FoodLog[]; groupDeleted: boolean; skippedLogIds: number[] }>(
    `/api/food-logs?${params.toString()}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ logIds }),
    }
  );
}

export async function deleteFoodLogsInRange(range: FoodLogDateRange): Promise<{ deleted: number }> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return fetchApi<{ deleted: number }>(`/api/food-logs?${params.toString()}`, {
    method: 'DELETE',
  });
}

export async function createFoodLogGroup(input: {
  display_name?: string | null;
  original_input?: string | null;
}): Promise<FoodLogGroup> {
  return fetchApi<FoodLogGroup>('/api/food-logs?resource=group', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
