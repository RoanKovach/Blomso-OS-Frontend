/**
 * Auth API - User.me(), login(), logout(), updateMyUserData().
 * Uses VITE_API_URL; when not set, me() throws so the app shows unauthenticated state.
 * Cognito Hosted UI: set VITE_APP_URL, VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID.
 */

import { apiGet, apiPost, apiPut, isApiConfigured } from './client.js';

const APP_URL = import.meta.env.VITE_APP_URL || '';
const COGNITO_DOMAIN = (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, '');
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

/** True when Hosted UI env vars are set so login/logout can use Cognito. */
export function isHostedUiConfigured() {
  return Boolean(APP_URL && COGNITO_DOMAIN && COGNITO_CLIENT_ID);
}

/** Build Cognito Hosted UI login URL (redirect_uri = app + /auth/callback). */
export function getLoginUrl() {
  if (!isHostedUiConfigured()) return null;
  const redirectUri = `${APP_URL.replace(/\/$/, '')}/auth/callback`;
  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    response_type: 'token',
    scope: 'openid email',
    redirect_uri: redirectUri,
  });
  return `${COGNITO_DOMAIN}/login?${params.toString()}`;
}

/** Build Cognito Hosted UI logout URL (logout_uri = app base). */
export function getLogoutUrl() {
  if (!isHostedUiConfigured()) return null;
  const logoutUri = APP_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    logout_uri: logoutUri,
  });
  return `${COGNITO_DOMAIN}/logout?${params.toString()}`;
}

/** True when the error indicates unauthenticated/guest (expected), not a real failure. */
export function isUnauthenticatedError(error) {
  if (!error) return false;
  const msg = error?.message ?? '';
  const status = error?.status;
  return (
    status === 401 ||
    status === 403 ||
    msg === 'User not authenticated' ||
    (typeof msg === 'string' && msg.includes('User not authenticated'))
  );
}

export const User = {
  async me() {
    if (!isApiConfigured()) {
      throw new Error('User not authenticated');
    }
    const data = await apiGet('/me');
    return data;
  },

  login() {
    if (!isApiConfigured()) {
      console.warn('API not configured; login is a no-op. Set VITE_API_URL and Cognito Hosted UI env vars.');
      return;
    }
    const loginUrl = getLoginUrl();
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      const fallback = import.meta.env.VITE_AUTH_LOGIN_URL;
      if (fallback) {
        window.location.href = fallback;
      } else {
        console.warn('Set VITE_APP_URL, VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID for Hosted UI login.');
      }
    }
  },

  logout() {
    try {
      localStorage.removeItem('blomso_auth_token');
      sessionStorage.removeItem('blomso_auth_token');
    } catch (_) {}
    const logoutUrl = getLogoutUrl();
    if (logoutUrl) {
      window.location.href = logoutUrl;
    } else {
      const fallback = import.meta.env.VITE_AUTH_LOGOUT_URL;
      if (fallback) {
        window.location.href = fallback;
      }
    }
  },

  async updateMyUserData(formData) {
    if (!isApiConfigured()) {
      throw new Error('API not configured');
    }
    const data = await apiPut('/me', formData);
    return data;
  },
};
