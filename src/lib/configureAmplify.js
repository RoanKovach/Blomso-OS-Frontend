import { Amplify } from 'aws-amplify';

/**
 * Optional Amplify Auth wiring so fetchAuthSession() can resolve tokens when the app
 * uses Amplify-managed sign-in. Hosted UI callback still persists the OAuth access
 * token in localStorage; that path is used as fallback in api/client.js when no
 * Amplify session exists.
 */
export function configureAmplifyIfNeeded() {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID?.trim();
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID?.trim();
  if (!userPoolId || !userPoolClientId) return;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });
}
