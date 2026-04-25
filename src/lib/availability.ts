// Shared availability helpers used by both the public profile page
// (to render an "upcoming slots" summary) and the booking page.
//
// Slot derivation walks the next N days against weekly recurring blocks,
// generates fixed-duration slots, then subtracts already-booked starts.

import { addDays, format, startOfDay } from 'date-fns';

export interface AvailabilityBlock {
  day_of_week: number; // 0 = Monday … 6 = Sunday (matches existing schema usage)
  start_time: string;  // "HH:MM" or "HH:MM:SS"
  end_time: string;
}

export interface BookedSlot {
  requested_date: string;       // "YYYY-MM-DD"
  requested_start_time: string; // "HH:MM" or "HH:MM:SS"
}

export interface UpcomingSlot {
  date: Date;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  label: string;     // "Tue 29 Apr · 10:00 AM"
}

const trim = (t: string) => t.slice(0, 5);

const formatTimeLabel = (t: string) => {
  const [h, m] = trim(t).split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const generateSlotsForBlock = (
  startTime: string,
  endTime: string,
  sessionMinutes: number,
  bufferMinutes: number,
): { startTime: string; endTime: string }[] => {
  const [sh, sm] = trim(startTime).split(':').map(Number);
  const [eh, em] = trim(endTime).split(':').map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const out: { startTime: string; endTime: string }[] = [];
  let cursor = startTotal;
  while (cursor + sessionMinutes <= endTotal) {
    const slotEnd = cursor + sessionMinutes;
    const startStr = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;
    out.push({ startTime: startStr, endTime: endStr });
    cursor = slotEnd + bufferMinutes;
  }
  return out;
};

interface NextSlotsOptions {
  daysAhead?: number;          // how many days forward to scan (default 14)
  sessionMinutes?: number;     // default 50
  bufferMinutes?: number;      // default 10
  limit?: number;              // max slots returned
  now?: Date;                  // injectable for tests
}

export const getNextAvailableSlots = (
  availability: AvailabilityBlock[],
  booked: BookedSlot[],
  opts: NextSlotsOptions = {},
): UpcomingSlot[] => {
  const {
    daysAhead = 14,
    sessionMinutes = 50,
    bufferMinutes = 10,
    limit = 3,
    now = new Date(),
  } = opts;

  if (!availability.length) return [];

  const bookedSet = new Set(
    booked.map(b => `${b.requested_date}|${trim(b.requested_start_time)}`),
  );

  const today = startOfDay(now);
  const out: UpcomingSlot[] = [];

  for (let i = 0; i < daysAhead && out.length < limit; i++) {
    const date = addDays(today, i);
    const jsDow = date.getDay();                   // 0 = Sun
    const dow = jsDow === 0 ? 6 : jsDow - 1;       // 0 = Mon … 6 = Sun
    const blocks = availability.filter(a => a.day_of_week === dow);
    if (!blocks.length) continue;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dateLabel = format(date, 'EEE d MMM');

    for (const block of blocks) {
      const slots = generateSlotsForBlock(
        block.start_time,
        block.end_time,
        sessionMinutes,
        bufferMinutes,
      );
      for (const s of slots) {
        if (bookedSet.has(`${dateStr}|${s.startTime}`)) continue;
        // If today, skip slots already past
        if (i === 0) {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const slotMs = new Date(date);
          slotMs.setHours(sh, sm, 0, 0);
          if (slotMs.getTime() <= now.getTime()) continue;
        }
        out.push({
          date,
          startTime: s.startTime,
          endTime: s.endTime,
          label: `${dateLabel} · ${formatTimeLabel(s.startTime)}`,
        });
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
    }
  }

  return out;
};
