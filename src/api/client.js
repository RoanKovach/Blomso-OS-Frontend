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

/** Store IdToken for authenticated backend calls. Used after Cognito login or for testing. */
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

export function authHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
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
  const res = await fetch(getUrl(path), {
    method: 'GET',
    headers: authHeaders(),
    ...options,
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
  const res = await fetch(getUrl(path), {
    method: 'POST',
    headers: authHeaders(),
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
    ...options,
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
  const res = await fetch(getUrl(path), {
    method: 'PUT',
    headers: authHeaders(),
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
    ...options,
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
  const res = await fetch(getUrl(path), {
    method: 'PATCH',
    headers: authHeaders(),
    body: typeof body === 'string' ? body : JSON.stringify(body ?? {}),
    ...options,
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
  const res = await fetch(getUrl(path), {
    method: 'DELETE',
    headers: authHeaders(),
    ...options,
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
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Do not set Content-Type; browser sets multipart boundary for FormData
  const res = await fetch(getUrl(path), {
    method: 'POST',
    headers,
    body: formData,
    ...options,
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
