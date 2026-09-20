export const getLocalDayRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

export const parseLegacyTimestamp = (timestamp?: string, fallback = new Date()): string => {
  if (!timestamp) return fallback.toISOString();
  const parsed = new Date(`${fallback.toDateString()} ${timestamp}`);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
};

export const formatLoggedAtTime = (loggedAt: string): string => {
  const parsed = new Date(loggedAt);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString();
};
