-- Seed placeholder for cron trigger secret. Operator must update value to match the
-- CRON_TRIGGER_SECRET edge function env var.
INSERT INTO public.m365_integration_config (key, value, description)
VALUES (
  'cron.trigger_secret',
  'REPLACE_ME',
  'Shared secret sent by pg_cron jobs as the X-Cron-Secret header to authenticate as the system caller. Must match the CRON_TRIGGER_SECRET edge function env var.'
)
ON CONFLICT (key) DO NOTHING;

-- Reschedule cron job to read secret from config row at execution time.
DO $$ BEGIN
  PERFORM cron.unschedule('m365-outlook-triage-15min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'm365-outlook-triage-15min',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/ms-outlook-triage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M',
      'X-Cron-Trigger', 'm365-outlook-triage-15min',
      'X-Cron-Secret', (SELECT value FROM public.m365_integration_config WHERE key = 'cron.trigger_secret')
    ),
    body := jsonb_build_object('triggeredAt', now(), 'source', 'pg_cron')
  ) AS request_id;
  $cron$
);