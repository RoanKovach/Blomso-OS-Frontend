/**
 * Derive display strings for the signed-in user card from /me response.
 * Priority: email > username (if not UUID) > full_name/name > truncated sub.
 * Never show raw Cognito sub as the main label.
 */

function looksLikeUUID(s) {
  if (!s || typeof s !== 'string') return false;
  return /^[0-9a-f-]{36}$/i.test(s) || (s.length > 20 && /^[0-9a-f]+$/i.test(s));
}

function truncateSub(sub) {
  if (!sub || typeof sub !== 'string') return null;
  return sub.length > 8 ? sub.slice(0, 8) + '…' : sub;
}

/**
 * @param {object} user - User object from GET /me (ok, sub, username, email, authProvider).
 * @returns {{ primary: string, secondary: string, initial: string }}
 */
export function getUserDisplayIdentity(user) {
  if (!user) {
    return { primary: 'User', secondary: 'Signed in', initial: 'U' };
  }

  const email = user.email || null;
  const username = user.username && !looksLikeUUID(user.username) ? user.username : null;
  const name = user.full_name || user.name || null;
  const subDisplay = user.sub ? truncateSub(user.sub) : null;

  const primary = email || username || name || subDisplay || 'User';
  const secondary = primary === email ? 'Signed in' : (email || 'Signed in');
  const initial = (primary && primary !== 'User' ? primary.charAt(0) : 'U').toUpperCase();

  return { primary, secondary, initial };
}
