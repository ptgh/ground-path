-- ============================================================
-- Compliance items: practice-wide regulatory expiry tracking
-- ============================================================
CREATE TABLE public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN (
    'registration', 'membership', 'insurance', 'check', 'certification', 'other'
  )),
  owner text NOT NULL DEFAULT 'practice',
  expires_at date,
  notes text,
  snoozed_until date,
  last_alerted_tier int,
  last_alerted_at timestamptz,
  renewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_items_expires
  ON public.compliance_items (expires_at)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read compliance"
  ON public.compliance_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write compliance"
  ON public.compliance_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger using project's existing helper
CREATE TRIGGER compliance_items_updated_at
  BEFORE UPDATE ON public.compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPC: renew an item (clears alert state, sets new expiry)
-- ============================================================
CREATE OR REPLACE FUNCTION public.renew_compliance_item(
  _id uuid, _new_expires_at date
) RETURNS public.compliance_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result public.compliance_items;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  UPDATE public.compliance_items
  SET expires_at = _new_expires_at,
      last_alerted_tier = NULL,
      last_alerted_at = NULL,
      renewed_at = now(),
      snoozed_until = NULL
  WHERE id = _id
  RETURNING * INTO result;
  RETURN result;
END $$;

-- ============================================================
-- RPC: snooze an item (clears tier so it re-fires after snooze)
-- ============================================================
CREATE OR REPLACE FUNCTION public.snooze_compliance_item(
  _id uuid, _snooze_until date
) RETURNS public.compliance_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result public.compliance_items;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  UPDATE public.compliance_items
  SET snoozed_until = _snooze_until,
      last_alerted_tier = NULL
  WHERE id = _id
  RETURNING * INTO result;
  RETURN result;
END $$;

-- ============================================================
-- Seed placeholder rows so the admin UI has content immediately
-- ============================================================
INSERT INTO public.compliance_items (name, kind, owner, notes) VALUES
  ('AHPRA Registration', 'registration', 'practice', 'Set expiry date once known'),
  ('AASW Membership', 'membership', 'practice', 'Set expiry date once known'),
  ('ACA Registration', 'registration', 'practice', 'Set expiry date once known'),
  ('NDIS Provider Registration', 'registration', 'practice', 'Set expiry date once known'),
  ('Professional Indemnity Insurance', 'insurance', 'practice', 'Set expiry date once known'),
  ('Public Liability Insurance', 'insurance', 'practice', 'Set expiry date once known');

-- ============================================================
-- Schedule the daily compliance check (22:00 UTC = 08:00 AEST)
-- ============================================================
SELECT cron.schedule(
  'compliance-daily-check',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vzwhccciarvirzqmvldl.supabase.co/functions/v1/compliance-daily-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2hjY2NpYXJ2aXJ6cW12bGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQzNDUsImV4cCI6MjA2Njk3MDM0NX0.9GMVDJSpyLosIwHdvk6c9yFl3rKEa_BNvLj45nkuk1M", "X-Cron-Trigger": "compliance-daily-check"}'::jsonb,
    body := jsonb_build_object('triggeredAt', now(), 'source', 'pg_cron')
  ) AS request_id;
  $$
);