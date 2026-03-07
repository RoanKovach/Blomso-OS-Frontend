/**
 * Derive display strings for the signed-in user card from GET /me response.
 * Priority: email → username (if not UUID/sub) → name (full_name/name) → shortened sub as last resort.
 * Never show raw Cognito sub as the primary label; only shortened sub when nothing else is available.
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

  const email = (user.email && typeof user.email === 'string') ? user.email.trim() : null;
  const rawUsername = (user.username && typeof user.username === 'string') ? user.username.trim() : null;
  const username = rawUsername && !looksLikeUUID(rawUsername) && rawUsername !== user.sub ? rawUsername : null;
  const name = (user.full_name || user.name) && typeof (user.full_name || user.name) === 'string'
    ? (user.full_name || user.name).trim() : null;
  const subDisplay = user.sub ? truncateSub(user.sub) : null;

  const primary = email || username || name || subDisplay || 'User';
  const secondary = 'Signed in';
  const initial = (primary && primary !== 'User' ? primary.charAt(0) : 'U').toUpperCase();

  return { primary, secondary, initial };
}
