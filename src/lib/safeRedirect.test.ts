import { describe, it, expect } from 'vitest';
import { getSafeRedirect } from './safeRedirect';

describe('getSafeRedirect', () => {
  it('returns a valid internal path from the allowlist', () => {
    expect(getSafeRedirect('?redirect=/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('?redirect=/practitioner/dashboard')).toBe('/practitioner/dashboard');
    expect(getSafeRedirect('?redirect=/messages')).toBe('/messages');
    expect(getSafeRedirect('?redirect=/practitioner/messages')).toBe('/practitioner/messages');
    expect(getSafeRedirect('?redirect=/practitioner/forms')).toBe('/practitioner/forms');
    expect(getSafeRedirect('?redirect=/practitioner/verify')).toBe('/practitioner/verify');
  });

  it('returns null for an external URL like https://evil.com', () => {
    expect(getSafeRedirect('?redirect=https://evil.com')).toBeNull();
  });

  it('returns null for a protocol-relative URL like //evil.com', () => {
    expect(getSafeRedirect('?redirect=//evil.com')).toBeNull();
  });

  it('returns null for an internal path not in the allowlist', () => {
    expect(getSafeRedirect('?redirect=/admin')).toBeNull();
    expect(getSafeRedirect('?redirect=/settings')).toBeNull();
    expect(getSafeRedirect('?redirect=/unknown/path')).toBeNull();
  });

  it('returns null for path traversal attempts', () => {
    expect(getSafeRedirect('?redirect=/dashboard/../etc/passwd')).toBeNull();
    expect(getSafeRedirect('?redirect=/dashboard/..')).toBeNull();
  });

  it('returns null when no redirect param is present', () => {
    expect(getSafeRedirect('')).toBeNull();
    expect(getSafeRedirect('?foo=bar')).toBeNull();
  });
});
