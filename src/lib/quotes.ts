// Curated, gentle, AASW-tone-safe lines used across the site for subtle delight.
// Selection is deterministic per UTC day so the same visitor sees the same line
// for a given session, regardless of which surface they read it on.

export const QUOTES: readonly string[] = [
  'Small steps still move mountains.',
  "You don't have to do it all today.",
  'Showing up is half the work.',
  'Care is a quiet kind of courage.',
  'Be gentle with yourself — you are doing better than you think.',
  'Rest is part of the practice, not a pause from it.',
  'Hard days end. Soft moments stay.',
  'Healing rarely moves in straight lines.',
  'Your pace is the right pace.',
  'A grounded breath is a small reset.',
  'Notice one thing today that helped.',
  'Progress hides in the ordinary.',
  'Compassion travels well — start with yourself.',
  'Even slow change is change.',
  'You are allowed to begin again, today.',
  "Curiosity is kinder than judgement.",
  'A little tenderness goes a long way.',
  'Steady is a kind of brave.',
  'You belong here, exactly as you are.',
  "Tomorrow doesn't need to be solved tonight.",
  'Quiet wins still count.',
  'You can hold two true things at once.',
  'Listening to yourself is a skill, not a luxury.',
  'Some days the work is just to keep going.',
  'Gentle attention changes everything.',
];

const dayOfYear = (d = new Date()) => {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
};

/** Pick a quote deterministically for `date` (defaults to today, UTC). */
export const quoteOfTheDay = (date = new Date()): string =>
  QUOTES[dayOfYear(date) % QUOTES.length];

/** Different rotation cadence for the footer so it doesn't echo the header. */
export const quoteOfTheDayFooter = (date = new Date()): string =>
  QUOTES[(dayOfYear(date) + 7) % QUOTES.length];
