-- Part A1: filter table
CREATE TABLE public.m365_inbox_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern TEXT NOT NULL UNIQUE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('exact', 'domain', 'prefix')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.m365_inbox_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "M365 admins read filters" ON public.m365_inbox_filters
  FOR SELECT TO authenticated USING (public.is_m365_authorised(auth.uid()));
CREATE POLICY "M365 admins manage filters" ON public.m365_inbox_filters
  FOR ALL TO authenticated USING (public.is_m365_authorised(auth.uid()))
  WITH CHECK (public.is_m365_authorised(auth.uid()));
CREATE POLICY "Service role full access filters" ON public.m365_inbox_filters
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Part A2: seed
INSERT INTO public.m365_inbox_filters (pattern, pattern_type, reason) VALUES
  ('halaxy.com',           'domain', 'Old booking system, decommissioned. All Halaxy notifications are noise.'),
  ('noreply',              'prefix', 'Auto-generated emails from any system are not human contacts'),
  ('no-reply',             'prefix', 'Variant spelling of noreply'),
  ('donotreply',           'prefix', 'Variant spelling of noreply'),
  ('do-not-reply',         'prefix', 'Variant spelling of noreply'),
  ('mailer-daemon',        'prefix', 'Bounce notifications'),
  ('postmaster',           'prefix', 'Mail server administrative messages'),
  ('o365mc@microsoft.com', 'exact',  'Microsoft 365 Message Center service updates'),
  ('microsoft-noreply@microsoft.com', 'exact', 'Microsoft service notifications')
ON CONFLICT (pattern) DO NOTHING;

-- Part B1: clean existing noise rows + audit each deletion
WITH deleted AS (
  DELETE FROM public.contact_forms cf
  WHERE cf.intake_source = 'inbox'
    AND (
      lower(cf.email) LIKE '%@halaxy.com'
      OR lower(cf.email) LIKE 'noreply%'
      OR lower(cf.email) LIKE 'no-reply%'
      OR lower(cf.email) LIKE 'donotreply%'
      OR lower(cf.email) LIKE 'do-not-reply%'
      OR lower(cf.email) = 'o365mc@microsoft.com'
      OR lower(cf.email) = 'microsoft-noreply@microsoft.com'
    )
  RETURNING id, email, subject, external_message_id
)
INSERT INTO public.m365_audit_log (function_name, action, status, target, request_metadata)
SELECT 'manual-cleanup', 'delete_noise_row', 'success', email,
       jsonb_build_object('contact_form_id', id, 'subject', subject, 'external_message_id', external_message_id)
FROM deleted;