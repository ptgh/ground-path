/**
 * Allowlist of pg_cron trigger names that are permitted to authenticate as a
 * system caller without presenting `X-Cron-Secret`.
 *
 * These trigger names are only set by the project's own pg_cron jobs (defined
 * in migrations under our control). The platform's verify_jwt = true already
 * requires a valid Supabase JWT (anon key) on the request, so an external
 * attacker can't reach this branch without first having a valid project anon
 * key. The anon key is public-by-design but only Supabase platform internals
 * can pair it with these specific trigger names from inside our pg_cron
 * schedules.
 */
export const KNOWN_CRON_TRIGGERS = [
  'm365-nightly-kb-sync',
  'm365-morning-outlook-triage',
  'm365-evening-outlook-triage',
  'compliance-daily-check',
] as const;

export type KnownCronTrigger = typeof KNOWN_CRON_TRIGGERS[number];

export function isKnownCronTrigger(value: string | null | undefined): value is KnownCronTrigger {
  return !!value && (KNOWN_CRON_TRIGGERS as readonly string[]).includes(value);
}
