import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

import { corsHeadersFor } from '../_shared/cors.ts';
/**
 * send-booking-reminders
 *
 * Runs on a schedule (pg_cron, every 15 min). Finds confirmed bookings whose
 * start time is between ~24h and ~24h15m away and that have NOT yet had a
 * reminder sent (reminder_sent_at IS NULL). For each, invokes the
 * `booking-notification` function with type=`session_reminder` which sends
 * the email and marks the booking as reminded.
 *
 * The window is intentionally wider than the cron interval (15 min) so we
 * never miss a booking if a cron tick is delayed.
 */

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Compute the AEST window 23h45m → 24h15m from now
    // Booking date/time fields are stored as plain date + time, interpreted as AEST (+10:00)
    const now = new Date();
    const lowerMs = now.getTime() + (23 * 60 + 45) * 60 * 1000;
    const upperMs = now.getTime() + (24 * 60 + 15) * 60 * 1000;

    // Pull all confirmed, not-yet-reminded bookings for the next ~2 days
    // (small set; we'll compute exact AEST instant per row)
    const today = new Date().toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: bookings, error } = await supabase
      .from('booking_requests')
      .select('id, requested_date, requested_start_time, status, reminder_sent_at')
      .eq('status', 'confirmed')
      .is('reminder_sent_at', null)
      .gte('requested_date', today)
      .lte('requested_date', dayAfter);

    if (error) {
      console.error('Query error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const due: string[] = [];
    for (const b of bookings || []) {
      const t = (b.requested_start_time as string).length === 5
        ? `${b.requested_start_time}:00`
        : (b.requested_start_time as string);
      const startMs = new Date(`${b.requested_date}T${t}+10:00`).getTime();
      if (startMs >= lowerMs && startMs <= upperMs) {
        due.push(b.id as string);
      }
    }

    console.log(`Reminder sweep: ${bookings?.length || 0} candidates, ${due.length} due`);

    const results: Array<{ bookingId: string; ok: boolean; status?: number; error?: string }> = [];
    for (const bookingId of due) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/booking-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ type: 'session_reminder', bookingId }),
        });
        results.push({ bookingId, ok: res.ok, status: res.status });
        if (!res.ok) {
          const txt = await res.text();
          console.error(`Reminder failed for ${bookingId}:`, res.status, txt);
        }
      } catch (err) {
        results.push({ bookingId, ok: false, error: err instanceof Error ? err.message : 'Unknown' });
        console.error(`Reminder exception for ${bookingId}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      candidates: bookings?.length || 0,
      due: due.length,
      results,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-booking-reminders error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
