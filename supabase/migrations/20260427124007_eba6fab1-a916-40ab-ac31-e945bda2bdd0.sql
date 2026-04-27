CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule: nightly KB sync at 16:30 UTC (≈ 02:30 AEST / 03:30 AEDT)
SELECT cron.schedule(
  'm365-nightly-kb-sync',
  '30 16 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/ms-kb-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M", "X-Cron-Trigger": "m365-nightly-kb-sync"}'::jsonb,
    body := jsonb_build_object('triggeredAt', now(), 'source', 'pg_cron')
  ) AS request_id;
  $$
);

-- Schedule: weekday morning Outlook triage at 21:00 UTC (≈ 07:00 AEST / 08:00 AEDT)
SELECT cron.schedule(
  'm365-morning-outlook-triage',
  '0 21 * * 0-4',
  $$
  SELECT net.http_post(
    url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/ms-outlook-triage',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M", "X-Cron-Trigger": "m365-morning-outlook-triage"}'::jsonb,
    body := jsonb_build_object('triggeredAt', now(), 'source', 'pg_cron')
  ) AS request_id;
  $$
);