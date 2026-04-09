/**
 * REST API client for backend-agnostic requests.
 * Uses VITE_API_URL; when empty or requests fail, callers receive errors or stubs.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

const AUTH_TOKEN_KEY = 'blomso_auth_token';

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist OAuth access token for API Authorization (Cognito Hosted UI hash).
 * Prefer Cognito access_token, not id_token, for API Gateway JWT authorizers.
 */
export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (_) {}
}

async function resolveBearerAccessToken() {
  const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID?.trim();
  if (poolId) {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (token) return token;
    } catch (_) {}
  }
  return getAuthToken();
}

export async function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = await resolveBearerAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getUrl(path) {
  const base = BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiGet(path, options = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL in your environment.');
  }
  const { headers: optionHeaders, ...restOptions } = options;
  const res = await fetch(getUrl(path), {
    method: 'GET',
    ...restOptions,
    headers: {
      ...(await authHeaders()),
      ...optionHeaders,
    },
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json();
  return res.text();
}

export async function apiPost(path, body, options = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL in your environment.');
  }
  const { headers: optionHeaders, ...restOptions } = options;
  const res = await fetch(getUrl(path), {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
    ...restOptions,
    headers: {
      ...(await authHeaders()),
      ...optionHeaders,
    },
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json();
  return res.text();
}

export async function apiPut(path, body, options = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL in your environment.');
  }
  const { headers: optionHeaders, ...restOptions } = options;
  const res = await fetch(getUrl(path), {
    method: 'PUT',
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
    ...restOptions,
    headers: {
      ...(await authHeaders()),
      ...optionHeaders,
    },
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json();
  return res.text();
}

export async function apiPatch(path, body, options = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL in your environment.');
  }
  const { headers: optionHeaders, ...restOptions } = options;
  const res = await fetch(getUrl(path), {
    method: 'PATCH',
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
    ...restOptions,
    headers: {
      ...(await authHeaders()),
      ...optionHeaders,
    },
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json();
  return res.text();
}

export async function apiDelete(path, options = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL in your environment.');
  }
  const { headers: optionHeaders, ...restOptions } = options;
  const res = await fetch(getUrl(path), {
    method: 'DELETE',
    ...restOptions,
    headers: {
      ...(await authHeaders()),
      ...optionHeaders,
    },
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json().catch(() => ({}));
  return res.text();
}

export async function apiPostForm(path, formData, options = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL in your environment.');
  }
  const jsonHeaders = await authHeaders();
  const { headers: optionHeaders, ...restOptions } = options;
  const headers = {};
  if (jsonHeaders['Authorization']) {
    headers['Authorization'] = jsonHeaders['Authorization'];
  }
  Object.assign(headers, optionHeaders);
  const res = await fetch(getUrl(path), {
    method: 'POST',
    body: formData,
    ...restOptions,
    headers,
  });
  if (!res.ok) {
    const err = new Error(res.statusText || `Request failed: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json();
  return res.text();
}

export function isApiConfigured() {
  return Boolean(BASE_URL);
}
