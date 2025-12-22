-- Remove the cron job I just created (keep the existing ones)
SELECT cron.unschedule('weekly-newsletter-generation');

-- Schedule the new article generation function every Monday at 8:00 AM UTC (before newsletter)
SELECT cron.schedule(
  'weekly-article-generation',
  '0 8 * * 1', -- Every Monday at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/generate-articles',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) AS request_id;
  $$
);