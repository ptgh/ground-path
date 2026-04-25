import { useEffect, useState, useCallback } from 'react';

const KEY_COUNT = 'gp_visit_count';
const KEY_LAST = 'gp_last_visit_at';
const KEY_STREAK = 'gp_streak_days';
const KEY_MILESTONE_PREFIX = 'gp_milestone_';

interface VisitorState {
  visitCount: number;
  isReturning: boolean;
  daysSinceLast: number | null;
  streak: number;
}

const safeRead = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeWrite = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Tracks lightweight, anonymous visit metadata in localStorage.
 * Used to drive subtle "welcome back" affordances. Never sent to a server.
 */
export const useReturningVisitor = (): VisitorState & {
  markMilestone: (name: string) => boolean;
  hasMilestone: (name: string) => boolean;
} => {
  const [state, setState] = useState<VisitorState>({
    visitCount: 0,
    isReturning: false,
    daysSinceLast: null,
    streak: 0,
  });

  useEffect(() => {
    const prevCount = Number(safeRead(KEY_COUNT) ?? '0');
    const prevLast = safeRead(KEY_LAST);
    const prevStreak = Number(safeRead(KEY_STREAK) ?? '0');

    const today = new Date();
    const todayKey = dayKey(today);
    let nextStreak = prevStreak;
    let daysSinceLast: number | null = null;

    if (prevLast) {
      const last = new Date(prevLast);
      const diffDays = Math.floor((today.getTime() - last.getTime()) / 86_400_000);
      daysSinceLast = diffDays;
      if (diffDays === 0) {
        // Same day — no streak change
        nextStreak = Math.max(prevStreak, 1);
      } else if (diffDays === 1) {
        nextStreak = prevStreak + 1;
      } else {
        nextStreak = 1;
      }
    } else {
      nextStreak = 1;
    }

    const nextCount = prevCount + 1;
    safeWrite(KEY_COUNT, String(nextCount));
    safeWrite(KEY_LAST, todayKey);
    safeWrite(KEY_STREAK, String(nextStreak));

    setState({
      visitCount: nextCount,
      isReturning: prevCount > 0,
      daysSinceLast,
      streak: nextStreak,
    });
  }, []);

  const hasMilestone = useCallback(
    (name: string) => safeRead(KEY_MILESTONE_PREFIX + name) === '1',
    [],
  );

  const markMilestone = useCallback(
    (name: string): boolean => {
      const k = KEY_MILESTONE_PREFIX + name;
      if (safeRead(k) === '1') return false;
      safeWrite(k, '1');
      return true;
    },
    [],
  );

  return { ...state, markMilestone, hasMilestone };
};
