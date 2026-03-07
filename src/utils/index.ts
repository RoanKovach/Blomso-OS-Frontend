
/**
 * Build app path for a page. Paths match React Router routes (PascalCase), e.g. /Dashboard, /Upload.
 * Preserves query string when present: createPageUrl('Recommendations?test_id=1') → '/Recommendations?test_id=1'.
 */
export function createPageUrl(pageName: string): string {
  const [path, ...rest] = pageName.split('?');
  const query = rest.length ? '?' + rest.join('?') : '';
  const segment = (path || '').replace(/ /g, '-').trim();
  return segment ? '/' + segment + query : '/Dashboard';
}

/** Default path after auth callback (must match a Route path). */
export const AUTH_RETURN_DEFAULT = '/Dashboard';