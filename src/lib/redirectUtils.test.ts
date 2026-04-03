import { describe, it, expect } from 'vitest';
import { getSafeRedirectPath, ALLOWED_REDIRECT_PATHS } from './redirectUtils';

describe('getSafeRedirectPath', () => {
  // Valid internal paths from the whitelist
  it('returns /dashboard for a whitelisted path', () => {
    expect(getSafeRedirectPath('/dashboard')).toBe('/dashboard');
  });

  it('returns /practitioner/dashboard for a whitelisted path', () => {
    expect(getSafeRedirectPath('/practitioner/dashboard')).toBe('/practitioner/dashboard');
  });

  it('returns /messages for a whitelisted path', () => {
    expect(getSafeRedirectPath('/messages')).toBe('/messages');
  });

  it('returns /practitioner/messages for a whitelisted path', () => {
    expect(getSafeRedirectPath('/practitioner/messages')).toBe('/practitioner/messages');
  });

  it('returns /practitioner/forms for a whitelisted path', () => {
    expect(getSafeRedirectPath('/practitioner/forms')).toBe('/practitioner/forms');
  });

  it('uses a custom defaultPath when supplied', () => {
    expect(getSafeRedirectPath(null, '/practitioner/verify')).toBe('/practitioner/verify');
  });

  // Null / empty / missing candidates
  it('falls back to default for null', () => {
    expect(getSafeRedirectPath(null)).toBe('/dashboard');
  });

  it('falls back to default for undefined', () => {
    expect(getSafeRedirectPath(undefined)).toBe('/dashboard');
  });

  it('falls back to default for empty string', () => {
    expect(getSafeRedirectPath('')).toBe('/dashboard');
  });

  // Malicious external / absolute URL redirects
  it('rejects an absolute http URL', () => {
    expect(getSafeRedirectPath('http://evil.com')).toBe('/dashboard');
  });

  it('rejects an absolute https URL', () => {
    expect(getSafeRedirectPath('https://evil.com/steal')).toBe('/dashboard');
  });

  it('rejects a protocol-relative URL (//evil.com)', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/dashboard');
  });

  it('rejects a path containing // (e.g. /dashboard//evil.com)', () => {
    expect(getSafeRedirectPath('/dashboard//evil.com')).toBe('/dashboard');
  });

  // Paths that start with / but are not in the whitelist
  it('rejects an unlisted internal path', () => {
    expect(getSafeRedirectPath('/admin')).toBe('/dashboard');
  });

  it('rejects a path with query string appended (not in whitelist)', () => {
    expect(getSafeRedirectPath('/dashboard?foo=bar')).toBe('/dashboard');
  });

  it('rejects a path with a trailing slash (not an exact whitelist match)', () => {
    expect(getSafeRedirectPath('/dashboard/')).toBe('/dashboard');
  });

  it('rejects a javascript: URI', () => {
    expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
  });

  it('rejects a data: URI', () => {
    expect(getSafeRedirectPath('data:text/html,<h1>x</h1>')).toBe('/dashboard');
  });

  // Verify the exported whitelist contains expected paths
  it('ALLOWED_REDIRECT_PATHS includes all expected paths', () => {
    expect(ALLOWED_REDIRECT_PATHS).toContain('/dashboard');
    expect(ALLOWED_REDIRECT_PATHS).toContain('/practitioner/dashboard');
    expect(ALLOWED_REDIRECT_PATHS).toContain('/messages');
    expect(ALLOWED_REDIRECT_PATHS).toContain('/practitioner/messages');
    expect(ALLOWED_REDIRECT_PATHS).toContain('/practitioner/forms');
  });
});
