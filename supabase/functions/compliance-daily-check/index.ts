/**
 * compliance-daily-check
 *
 * Runs daily at 22:00 UTC (08:00 Brisbane AEST). Scans
 * `compliance_items`, computes per-item urgency tier from days-to-expiry,
 * skips items already alerted at the current-or-more-urgent tier, and
 * posts a single grouped digest to Teams (`teams.alerts`).
 *
 * After successful posting it stamps `last_alerted_tier` / `last_alerted_at`
 * on each alerted row (fire-and-forget) and writes one audit row summarising
 * the run. Quiet days (zero items) skip the Teams post but still audit.
 *
 * Auth: requireM365Caller (cron-secret + admin path).
 */
import {
  m365CorsHeaders, jsonResponse, requireM365Caller,
  fireAndForgetOpsLog,
} from '../_shared/m365.ts';

/* ============================================================
 *  Tier bands
 * ============================================================ */
type TierRow = {
  id: string;
  name: string;
  kind: string;
  owner: string;
  expires_at: string;
  last_alerted_tier: number | null;
  days_remaining: number;
  tier: number;          // 0 = overdue, 1/3/7/14/30/60/90
};

function bandFor(daysRemaining: number): number | null {
  if (daysRemaining < 0) return 0;
  if (daysRemaining <= 1) return 1;
  if (daysRemaining <= 3) return 3;
  if (daysRemaining <= 7) return 7;
  if (daysRemaining <= 14) return 14;
  if (daysRemaining <= 30) return 30;
  if (daysRemaining <= 60) return 60;
  if (daysRemaining <= 89) return 90;
  return null;
}

/**
 * Should this row alert now?
 * - tier=0 (overdue) is always more urgent than any non-zero tier
 * - otherwise lower numeric tier = more urgent
 * Skip if last_alerted_tier already represents this-or-more urgent state.
 */
function shouldAlert(currentTier: number, lastTier: number | null): boolean {
  if (lastTier === null || lastTier === undefined) return true;
  if (lastTier === 0) return false; // already alerted as overdue
  if (currentTier === 0) return true; // newly overdue
  return currentTier < lastTier;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fireAndForget(p: Promise<unknown> | PromiseLike<unknown>): void {
  const wrapped = Promise.resolve(p).catch((err) =>
    console.error('compliance-daily-check fire-and-forget swallowed:', err),
  );
  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  if (er && typeof er.waitUntil === 'function') {
    try { er.waitUntil(wrapped); } catch { /* ignore */ }
  }
}

async function invokeTeamsNotify(
  body: unknown,
  ctx: { supabaseUrl: string; anonKey: string; cronSecret: string },
): Promise<void> {
  try {
    const res = await fetch(`${ctx.supabaseUrl}/functions/v1/ms-teams-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ctx.anonKey}`,
        'X-Cron-Trigger': 'compliance-daily-check',
        'X-Cron-Secret': ctx.cronSecret,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[compliance-daily-check] ms-teams-notify HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error('[compliance-daily-check] ms-teams-notify threw:', err);
  }
}

/* ============================================================
 *  Main handler
 * ============================================================ */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders(req) });

  // Capture latency clock BEFORE any awaits so audit reflects total
  // wall-clock time from request entry to response dispatch.
  const startedAt = Date.now();

  // Resolve triggered_by up front (before guard) so we can attribute the
  // audit row even on auth failures down the line. Cron header > admin user
  // email lookup > null. Mirrors the pattern in send-email/index.ts.
  const cronTrigger = req.headers.get('X-Cron-Trigger');
  let triggeredBy: string | null = cronTrigger ?? null;

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500, req);
  const svc = guard.caller!.serviceClient;
  const caller = guard.caller!;

  // If no cron trigger header (manual admin invocation), look up the caller's
  // email via the service client. caller.email is already populated by
  // requireM365Caller for both cron and JWT branches, so use it directly.
  if (!triggeredBy) {
    triggeredBy = caller.email ?? null;
  }

  // today (UTC) as YYYY-MM-DD
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const { data: items, error: itemsErr } = await svc
    .from('compliance_items')
    .select('id, name, kind, owner, expires_at, snoozed_until, last_alerted_tier')
    .not('expires_at', 'is', null);

  if (itemsErr) {
    console.error('[compliance-daily-check] load failed:', itemsErr);
    return jsonResponse({ error: itemsErr.message }, 500, req);
  }

  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const candidates: TierRow[] = [];
  for (const r of items ?? []) {
    if (r.snoozed_until && r.snoozed_until > todayIso) continue;
    if (!r.expires_at) continue;
    const [y, m, d] = (r.expires_at as string).split('-').map(Number);
    const expMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
    const days = Math.round((expMs - todayMs) / 86_400_000);
    const tier = bandFor(days);
    if (tier === null) continue;
    if (!shouldAlert(tier, r.last_alerted_tier as number | null)) continue;
    candidates.push({
      id: r.id as string,
      name: r.name as string,
      kind: r.kind as string,
      owner: r.owner as string,
      expires_at: r.expires_at as string,
      last_alerted_tier: r.last_alerted_tier as number | null,
      days_remaining: days,
      tier,
    });
  }

  const tiersHit = Array.from(new Set(candidates.map((c) => c.tier))).sort((a, b) => a - b);
  const urgent = candidates.some((c) => c.tier <= 7);

  // Build & post Teams digest only if there's something to alert
  if (candidates.length > 0) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const cronSecret = Deno.env.get('CRON_TRIGGER_SECRET') ?? '';

    const subject = urgent
      ? `URGENT: Compliance — ${candidates.length} item(s) expiring soon`
      : `Compliance — ${candidates.length} item(s) approaching expiry`;

    // Group by tier, urgent first (overdue=0 first, then 1,3,7,14,30,60,90)
    const tierOrder = [0, 1, 3, 7, 14, 30, 60, 90];
    const groups = new Map<number, TierRow[]>();
    for (const c of candidates) {
      const arr = groups.get(c.tier) ?? [];
      arr.push(c);
      groups.set(c.tier, arr);
    }

    const tierLabel = (t: number): string => {
      if (t === 0) return 'Overdue';
      if (t === 1) return 'Expiring within 1 day';
      return `Expiring within ${t} days`;
    };

    const sections: string[] = [];
    for (const t of tierOrder) {
      const rows = groups.get(t);
      if (!rows || rows.length === 0) continue;
      const lines = rows.map((r) => {
        const safeName = escapeHtml(r.name);
        const safeOwner = escapeHtml(r.owner);
        if (r.tier === 0) {
          return `<li><b>OVERDUE: ${safeName}</b> (${safeOwner}) — expired ${r.expires_at}, ${Math.abs(r.days_remaining)} day(s) ago</li>`;
        }
        return `<li><b>${safeName}</b> (${safeOwner}) — expires ${r.expires_at}, ${r.days_remaining} day(s)</li>`;
      }).join('');
      sections.push(`<p><b>${escapeHtml(tierLabel(t))}</b></p><ul>${lines}</ul>`);
    }

    const bodyHtml = sections.join('');

    if (supabaseUrl && anonKey && cronSecret) {
      fireAndForget(invokeTeamsNotify({
        configKey: 'teams.alerts',
        subject,
        bodyHtml,
        importance: urgent ? 'high' : 'normal',
      }, { supabaseUrl, anonKey, cronSecret }));
    } else {
      console.warn('[compliance-daily-check] Missing env for Teams post; skipping notification.');
    }

    // Stamp last_alerted_tier / last_alerted_at on each alerted row (fire-and-forget)
    const alertedAt = new Date().toISOString();
    for (const c of candidates) {
      fireAndForget(
        svc.from('compliance_items')
          .update({ last_alerted_tier: c.tier, last_alerted_at: alertedAt })
          .eq('id', c.id),
      );
    }
  }

  const runtimeMs = Date.now() - startedAt;

  // Audit row — always written (quiet days too)
  fireAndForget(svc.from('m365_audit_log').insert({
    user_id: caller.userId,
    user_email: caller.email,
    function_name: 'compliance-daily-check',
    action: 'check',
    target: null,
    status: 'success',
    request_metadata: {
      items_alerted: candidates.length,
      tiers_hit: tiersHit,
      runtime_ms: runtimeMs,
    },
  }));

  return jsonResponse({
    ok: true,
    items_alerted: candidates.length,
    tiers_hit: tiersHit,
    runtime_ms: runtimeMs,
  }, req);
});
