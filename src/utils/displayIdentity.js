/**
 * Derive display strings for the signed-in user card from GET /me response.
 * Primary label priority: full_name → name → email (full) → username when it looks like an email (full) →
 * human username (non-UUID, not sub) → shortened sub. (A dedicated “email local-part” slot is redundant once a full
 * mailbox string is chosen; if you later need short-only labels, branch here.)
 * Never prefer a UUID/sub-style username over email.
 */

function looksLikeUUID(s) {
  if (!s || typeof s !== 'string') return false;
  return /^[0-9a-f-]{36}$/i.test(s) || (s.length > 20 && /^[0-9a-f]+$/i.test(s));
}

function truncateSub(sub) {
  if (!sub || typeof sub !== 'string') return null;
  return sub.length > 8 ? sub.slice(0, 8) + '…' : sub;
}

function trimStr(v) {
  if (v == null || typeof v !== 'string') return null;
  const t = v.trim();
  return t || null;
}

/**
 * @param {object} user - User object from GET /me (ok, sub, username, email, authProvider).
 * @returns {{ primary: string, secondary: string, initial: string }}
 */
export function getUserDisplayIdentity(user) {
  if (!user) {
    return { primary: 'User', secondary: 'Signed in', initial: 'U' };
  }

  const fullName = trimStr(user.full_name);
  const name = trimStr(user.name);
  const email = trimStr(user.email);
  const rawUsername = trimStr(user.username);
  const sub = trimStr(user.sub);

  const usernameAsEmail = rawUsername && rawUsername.includes('@') ? rawUsername : null;
  const humanUsername =
    rawUsername && rawUsername !== sub && !looksLikeUUID(rawUsername) && !usernameAsEmail
      ? rawUsername
      : null;

  const primary =
    fullName ||
    name ||
    email ||
    usernameAsEmail ||
    humanUsername ||
    (sub ? truncateSub(sub) : null) ||
    'User';

  const secondary = 'Signed in';
  const initial = (primary && primary !== 'User' ? primary.charAt(0) : 'U').toUpperCase();

  return { primary, secondary, initial };
}
