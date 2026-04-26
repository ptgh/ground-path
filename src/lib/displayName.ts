/**
 * Naming conventions for the messaging UI and clinical contexts.
 *
 * Convention:
 *  - Conversation list, thread header, message bubbles → "Paul H." (first + last initial)
 *  - Popover detail view → "Paul Henderson" (full name, deliberate)
 *  - When practitioner & client share a first name → always include last initial everywhere
 *  - Empty profile fallback → "Client #a1b2" + Profile incomplete badge
 */

export interface NameParts {
  /** Raw display_name from the profile (may be null/empty) */
  displayName?: string | null;
  /** Stable user_id used to derive a short fallback handle */
  userId: string;
  /** Role for chip + fallback label */
  role?: 'client' | 'practitioner';
}

/**
 * Short display name for chrome (lists, headers, bubbles).
 * "Paul Henderson" → "Paul H."
 * "Paul"           → "Paul"
 * null/empty       → "Client #a1b2" (or "Practitioner #a1b2")
 */
export function shortName({ displayName, userId, role = 'client' }: NameParts): string {
  const trimmed = displayName?.trim();
  if (!trimmed) {
    const handle = userId.replace(/-/g, '').slice(0, 4);
    const label = role === 'practitioner' ? 'Practitioner' : 'Client';
    return `${label} #${handle}`;
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

/**
 * Full name for deliberate detail views (popover header, profile pages).
 * Falls back to short name when display_name is empty.
 */
export function fullName({ displayName, userId, role = 'client' }: NameParts): string {
  const trimmed = displayName?.trim();
  if (!trimmed) return shortName({ displayName, userId, role });
  return trimmed;
}

/**
 * Initials for avatars. Uses first letter of first + last word.
 */
export function initials(displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/**
 * True when the profile has no display_name set (used to show the
 * "Profile incomplete" badge).
 */
export function isProfileIncomplete(displayName?: string | null): boolean {
  return !displayName || !displayName.trim();
}
