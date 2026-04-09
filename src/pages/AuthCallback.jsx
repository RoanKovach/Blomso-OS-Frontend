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
 * Important: API Gateway JWT authorizer expects the Cognito *access token* as the Bearer token.
 * We still keep the id_token (when present) for potential UI identity needs.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const hash = window.location.hash?.slice(1) || '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');
    const error = params.get('error');
    const rawReturn = new URLSearchParams(window.location.search).get('returnTo');
    const returnTo = sanitizeReturnTo(rawReturn) || AUTH_RETURN_DEFAULT;

    if (error) {
      setMessage('Sign-in was cancelled or failed.');
      const t = setTimeout(() => navigate(returnTo, { replace: true }), 2000);
      return () => clearTimeout(t);
    }

    // Use access_token for API Authorization header.
    if (accessToken) {
      setAuthToken(accessToken);
      // Store id_token separately for optional UI usage (not used for API auth).
      if (idToken) {
        try {
          localStorage.setItem('blomso_id_token', idToken);
        } catch (_) {}
      }
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
