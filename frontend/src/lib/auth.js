const TOKEN_KEY = 'bace_token';
const USER_KEY = 'bace_user';

const safeParseJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isTokenExpired = (token, skewSeconds = 30) => {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
};

export const getAuthSession = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = safeParseJson(localStorage.getItem(USER_KEY));

  if (!token || !user || isTokenExpired(token)) {
    clearAuthSession();
    return { token: null, user: null, isAuthenticated: false };
  }

  return { token, user, isAuthenticated: true };
};

export const saveAuthSession = ({ token, user }) => {
  if (!token || !user) {
    clearAuthSession();
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
