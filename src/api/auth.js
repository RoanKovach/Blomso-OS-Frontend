/**
 * Auth API - User.me(), login(), logout(), updateMyUserData().
 * Uses VITE_API_URL; when not set, me() throws so the app shows unauthenticated state.
 */

import { apiGet, apiPost, apiPut, isApiConfigured } from './client.js';

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
      console.warn('API not configured; login is a no-op. Set VITE_API_URL and implement /auth/login or Cognito Hosted UI.');
      return;
    }
    // Redirect to Cognito Hosted UI or your login page when backend is ready
    const loginUrl = import.meta.env.VITE_AUTH_LOGIN_URL;
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      console.warn('VITE_AUTH_LOGIN_URL not set; implement login flow in your backend.');
    }
  },

  logout() {
    try {
      localStorage.removeItem('blomso_auth_token');
      sessionStorage.removeItem('blomso_auth_token');
    } catch (_) {}
    if (isApiConfigured()) {
      const logoutUrl = import.meta.env.VITE_AUTH_LOGOUT_URL;
      if (logoutUrl) {
        window.location.href = logoutUrl;
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
