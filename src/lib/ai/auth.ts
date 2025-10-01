// AI Features Authentication
const AI_PASSCODE = '1212';
const AI_AUTH_KEY = 'nutritrack_ai_auth';

export const authenticateAI = (passcode: string): boolean => {
  if (passcode === AI_PASSCODE) {
    localStorage.setItem(AI_AUTH_KEY, 'true');
    return true;
  }
  return false;
};

export const isAIAuthenticated = (): boolean => {
  return localStorage.getItem(AI_AUTH_KEY) === 'true';
};

export const logoutAI = (): void => {
  localStorage.removeItem(AI_AUTH_KEY);
};
