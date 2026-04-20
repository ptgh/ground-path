export const ALLOWED_REDIRECTS = [
  '/dashboard',
  '/practitioner/dashboard',
  '/messages',
  '/practitioner/messages',
  '/practitioner/forms',
  '/practitioner/verify',
  '/book',
  '/auth',
  '/account/billing',
];

export function getSafeRedirect(search: string): string | null {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam) return null;
  if (!redirectParam.startsWith('/')) return null;
  if (redirectParam.includes('//')) return null;
  if (redirectParam.includes('..')) return null;
  if (!ALLOWED_REDIRECTS.includes(redirectParam)) return null;
  return redirectParam;
}
