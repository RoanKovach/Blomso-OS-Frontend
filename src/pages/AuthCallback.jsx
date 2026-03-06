import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '@/api/client';

/** Default redirect after login; must match app route path (PascalCase /Dashboard). */
const DEFAULT_RETURN = '/Dashboard';

/**
 * OAuth callback for Cognito Hosted UI. Parses id_token from URL fragment,
 * stores it, and redirects to Dashboard (or returnTo from state).
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const hash = window.location.hash?.slice(1) || '';
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    const error = params.get('error');

    if (error) {
      setMessage('Sign-in was cancelled or failed.');
      const returnTo = new URLSearchParams(window.location.search).get('returnTo') || DEFAULT_RETURN;
      const t = setTimeout(() => navigate(returnTo, { replace: true }), 2000);
      return () => clearTimeout(t);
    }

    if (idToken) {
      setAuthToken(idToken);
      const returnTo = new URLSearchParams(window.location.search).get('returnTo') || DEFAULT_RETURN;
      window.history.replaceState({}, document.title, returnTo);
      navigate(returnTo, { replace: true });
      return;
    }

    setMessage('No token received. Redirecting...');
    const t = setTimeout(() => navigate(DEFAULT_RETURN, { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
