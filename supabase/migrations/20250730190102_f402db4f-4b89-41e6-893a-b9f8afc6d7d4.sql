-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to send weekly newsletter every Monday at 9:00 AM AEST
SELECT cron.schedule(
  'weekly-newsletter-groundpath',
  '0 9 * * 1', -- Every Monday at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/weekly-newsletter',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M"}'::jsonb,
        body:='{"triggered_by": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Add email preferences to mailing_list table
ALTER TABLE public.mailing_list 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "newsletter": true,
  "updates": true,
  "promotions": true
}'::jsonb;

-- Add unsubscribe token for one-click unsubscribe
ALTER TABLE public.mailing_list 
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex');

-- Create index for unsubscribe tokens
CREATE INDEX IF NOT EXISTS idx_mailing_list_unsubscribe_token ON mailing_list(unsubscribe_token);

-- Update existing records to have unsubscribe tokens
UPDATE public.mailing_list 
SET unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE unsubscribe_token IS NULL;