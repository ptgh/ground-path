import { describe, it, expect } from 'vitest';
import { getNextAvailableSlots } from './availability';

describe('getNextAvailableSlots', () => {
  // Use a Wednesday at 8am as "now" — Wed = day_of_week 2 in our schema.
  const now = new Date('2026-04-29T08:00:00');

  it('returns nothing when there is no availability', () => {
    expect(getNextAvailableSlots([], [], { now })).toEqual([]);
  });

  it('derives upcoming slots from a recurring weekly block', () => {
    const slots = getNextAvailableSlots(
      [{ day_of_week: 2, start_time: '09:00', end_time: '11:00' }],
      [],
      { now, limit: 5, sessionMinutes: 50, bufferMinutes: 10 },
    );
    // 09:00–09:50 and 10:00–10:50 today; then same again next Wednesday.
    expect(slots.length).toBeGreaterThanOrEqual(2);
    expect(slots[0].startTime).toBe('09:00');
    expect(slots[1].startTime).toBe('10:00');
  });

  it('skips slots that are already booked', () => {
    const slots = getNextAvailableSlots(
      [{ day_of_week: 2, start_time: '09:00', end_time: '11:00' }],
      [{ requested_date: '2026-04-29', requested_start_time: '09:00' }],
      { now, limit: 1 },
    );
    expect(slots[0].startTime).toBe('10:00');
  });

  it('respects the limit', () => {
    const slots = getNextAvailableSlots(
      [{ day_of_week: 2, start_time: '09:00', end_time: '17:00' }],
      [],
      { now, limit: 2 },
    );
    expect(slots).toHaveLength(2);
  });
});
