export const GOOGLE_CLIENT_ID = "1027473678070-7qnnq1mr9j6g1gi3jtkk5gbq5o6gpoo5.apps.googleusercontent.com";

export const getAuthToken = () => {
  return localStorage.getItem('ig_user_token') || '';
};

export const setAuthToken = (token, user) => {
  if (token) {
    localStorage.setItem('ig_user_token', token);
  } else {
    localStorage.removeItem('ig_user_token');
  }
  if (user) {
    localStorage.setItem('ig_user_profile', JSON.stringify(user));
  } else {
    localStorage.removeItem('ig_user_profile');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('ig_user_token');
  localStorage.removeItem('ig_user_profile');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('ig_user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const PERMANENT_BACKEND_URL = "https://approval-shifty-game.ngrok-free.dev";

export const getApiBase = () => {
  const custom = (localStorage.getItem('ig_api_base') || '').trim().replace(/\/+$/, '');
  if (custom) return custom;

  // 如果是在远程外网运行（如 still-sea-4a4c.ts-chank.workers.dev 或手机端），默认直连专属永久后端！
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return PERMANENT_BACKEND_URL;
  }

  // 本地环境默认使用相对路径
  return '';
};

export const API_BASE = getApiBase();

export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

// 全局 API 请求自动附加 Ngrok 标头并自动注入 Bearer Token
export const setupFetchInterceptor = () => {
  if (typeof window === 'undefined' || !window.fetch || window.__ig_fetch_interceptor_set) return;
  window.__ig_fetch_interceptor_set = true;
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, config] = args;
    if (typeof resource === 'string' && (resource.includes('ngrok') || resource.includes('/api/'))) {
      const newConfig = { ...(config || {}) };
      const headers = {
        ...(newConfig.headers || {}),
        'ngrok-skip-browser-warning': 'true'
      };
      const token = localStorage.getItem('ig_user_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      newConfig.headers = headers;
      return originalFetch.call(this, resource, newConfig);
    }
    return originalFetch.apply(this, args);
  };
};

export const getAvatarProxyUrl = (rawUrl, customApiBase) => {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://localhost') || rawUrl.startsWith('/data/')) return rawUrl;
  const base = customApiBase !== undefined ? customApiBase : getApiBase();
  return `${base}/api/avatar_proxy?url=${encodeURIComponent(rawUrl)}`;
};

export const sanitizeUsername = (raw) => {
  if (!raw) return '';
  return String(raw).replace('@', '').split('/')[0].split('?')[0].split('&')[0].trim();
};
