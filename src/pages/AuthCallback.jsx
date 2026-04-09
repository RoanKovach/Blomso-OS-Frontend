import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '@/api/client';
import { AUTH_RETURN_DEFAULT } from '@/utils';

/**
 * Allow only same-origin relative paths (no open redirect). Rejects protocol-relative (//) and backslash.
 */
function sanitizeReturnTo(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('//') || trimmed.includes('\\')) return null;
  if (trimmed.startsWith('/')) return trimmed;
  if (!trimmed.startsWith('http')) return '/' + trimmed;
  return null;
}

/**
 * OAuth callback for Cognito Hosted UI.
 *
 * Stores the id_token as the API Bearer token.
 * Also persists access_token separately when present.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const hash = window.location.hash?.slice(1) || '';
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const rawReturn = new URLSearchParams(window.location.search).get('returnTo');
    const returnTo = sanitizeReturnTo(rawReturn) || AUTH_RETURN_DEFAULT;

    if (error) {
      setMessage('Sign-in was cancelled or failed.');
      const t = setTimeout(() => navigate(returnTo, { replace: true }), 2000);
      return () => clearTimeout(t);
    }

    // Optional: store access token separately (not used for API auth here).
    if (accessToken) {
      try {
        localStorage.setItem('blomso_access_token', accessToken);
      } catch (_) {}
    }

    if (idToken) {
      setAuthToken(idToken);
      window.location.replace(window.location.origin + returnTo);
      return;
    }

    setMessage('No token received. Redirecting...');
    const t = setTimeout(() => navigate(returnTo, { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
