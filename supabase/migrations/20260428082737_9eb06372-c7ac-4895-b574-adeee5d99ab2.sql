-- Part A schema changes
ALTER TABLE public.contact_forms
  ADD COLUMN IF NOT EXISTS intake_type text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS intake_source text NOT NULL DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS external_message_id text;

-- Constrain values
DO $$ BEGIN
  ALTER TABLE public.contact_forms
    ADD CONSTRAINT contact_forms_intake_type_check
    CHECK (intake_type IN ('client','practitioner','other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.contact_forms
    ADD CONSTRAINT contact_forms_intake_source_check
    CHECK (intake_source IN ('form','inbox'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index for dedup lookups
CREATE INDEX IF NOT EXISTS idx_contact_forms_external_message_id
  ON public.contact_forms (external_message_id)
  WHERE external_message_id IS NOT NULL;

-- Backfill existing rows already covered by defaults; ensure non-null
UPDATE public.contact_forms
  SET intake_type = COALESCE(intake_type, 'other'),
      intake_source = COALESCE(intake_source, 'form');

-- Reschedule Outlook triage cron: every 15 min, 7 days a week
DO $$ BEGIN
  PERFORM cron.unschedule('m365-morning-outlook-triage');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('m365-outlook-triage-15min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'm365-outlook-triage-15min',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/ms-outlook-triage',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M", "X-Cron-Trigger": "m365-outlook-triage-15min"}'::jsonb,
    body := jsonb_build_object('triggeredAt', now(), 'source', 'pg_cron')
  ) AS request_id;
  $cron$
);