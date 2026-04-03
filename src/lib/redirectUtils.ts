// Allowed internal redirect paths after authentication
export const ALLOWED_REDIRECT_PATHS: ReadonlyArray<string> = [
  '/dashboard',
  '/practitioner/dashboard',
  '/messages',
  '/practitioner/messages',
  '/practitioner/forms',
];

/**
 * Returns a safe redirect path by validating the candidate against the whitelist.
 * Falls back to `defaultPath` if the candidate is absent, external, or not whitelisted.
 *
 * Rules applied in order:
 *  1. Must be a non-empty string.
 *  2. Must start with '/' (no protocol-relative or absolute URLs).
 *  3. Must not contain '//' (blocks protocol-relative URLs like //evil.com).
 *  4. Must be present in ALLOWED_REDIRECT_PATHS.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  defaultPath: string = '/dashboard',
): string {
  if (!candidate) return defaultPath;
  if (!candidate.startsWith('/')) return defaultPath;
  if (candidate.includes('//')) return defaultPath;
  if (!ALLOWED_REDIRECT_PATHS.includes(candidate)) return defaultPath;
  return candidate;
}
