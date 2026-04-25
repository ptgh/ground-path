// Combine a practitioner's identity codes from multiple registration sources
// (profile-level AASW/SWE/AHPRA columns + practitioner_registrations rows)
// into a single display list like:
//   [{ label: 'Social Worker', code: 'AASW' }, { label: 'Counsellor', code: 'ACA' }]
// Used on directory cards, the booking page, and the public profile hub so
// practitioners with multiple credentials are represented consistently.

export interface RegistrationRow {
  body_name: string;
  registration_number?: string | null;
}

export interface ProfessionalIdentity {
  label: string;       // e.g. "Social Worker"
  code: string;        // e.g. "AASW"
  number?: string | null;
}

interface BuildArgs {
  profession?: string | null;
  aaswNumber?: string | null;
  sweNumber?: string | null;
  ahpraNumber?: string | null;
  registrations?: RegistrationRow[];
}

const BODY_TO_LABEL: Record<string, string> = {
  AASW: 'Social Worker',
  ACA: 'Counsellor',
  PACFA: 'Counsellor',
  AHPRA: 'Registered Practitioner',
  AAFT: 'Family Therapist',
  APS: 'Psychologist',
  RACGP: 'GP',
  ACMHN: 'Mental Health Nurse',
  ANZASW: 'Social Worker',
};

const formatProfessionLabel = (profession: string) =>
  profession.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const labelForBody = (body: string): string => {
  const upper = body.trim().toUpperCase();
  return BODY_TO_LABEL[upper] ?? formatProfessionLabel(body);
};

/**
 * Build deduplicated identity entries from all available sources.
 * Order: profile.profession-derived → AASW → SWE → AHPRA → extra registrations.
 */
export const buildProfessionalIdentities = ({
  profession,
  aaswNumber,
  sweNumber,
  ahpraNumber,
  registrations = [],
}: BuildArgs): ProfessionalIdentity[] => {
  const seen = new Set<string>();
  const out: ProfessionalIdentity[] = [];

  const push = (entry: ProfessionalIdentity) => {
    const key = `${entry.label.toLowerCase()}|${entry.code.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(entry);
  };

  if (aaswNumber && aaswNumber.trim()) {
    push({ label: 'Social Worker', code: 'AASW', number: aaswNumber.trim() });
  }
  if (sweNumber && sweNumber.trim()) {
    push({ label: 'Social Worker', code: 'SWE', number: sweNumber.trim() });
  }
  if (ahpraNumber && ahpraNumber.trim()) {
    push({ label: 'Registered Practitioner', code: 'AHPRA', number: ahpraNumber.trim() });
  }

  for (const r of registrations) {
    if (!r?.body_name) continue;
    push({
      label: labelForBody(r.body_name),
      code: r.body_name.trim().toUpperCase(),
      number: r.registration_number ?? null,
    });
  }

  // Final fallback — show profession label alone if no registrations exist
  if (out.length === 0 && profession && profession.trim()) {
    out.push({ label: formatProfessionLabel(profession), code: '' });
  }

  return out;
};

/** Render identities as a single line, e.g. "Social Worker (AASW) · Counsellor (ACA)". */
export const formatIdentitiesLine = (identities: ProfessionalIdentity[]): string =>
  identities
    .map((i) => (i.code ? `${i.label} (${i.code})` : i.label))
    .join(' · ');
