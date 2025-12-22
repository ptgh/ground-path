-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule weekly newsletter generation every Monday at 9:00 AM UTC
SELECT cron.schedule(
  'weekly-newsletter-generation',
  '0 9 * * 1', -- Every Monday at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/weekly-newsletter',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) AS request_id;
  $$
);