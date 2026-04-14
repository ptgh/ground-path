
-- Organisation-level Microsoft 365 integration table
CREATE TABLE public.org_microsoft_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'microsoft',
  integration_mode text NOT NULL DEFAULT 'org_managed',
  tenant_id text,
  organizer_email text,
  service_identity_reference text,
  teams_enabled boolean NOT NULL DEFAULT true,
  calendar_enabled boolean NOT NULL DEFAULT false,
  connection_status text NOT NULL DEFAULT 'disconnected',
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_sync_at timestamptz,
  scopes text[] DEFAULT ARRAY['OnlineMeetings.ReadWrite', 'Calendars.ReadWrite']::text[],
  config_version integer NOT NULL DEFAULT 1,
  token_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_microsoft_integration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage org Microsoft integration"
  ON public.org_microsoft_integration FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to org Microsoft integration"
  ON public.org_microsoft_integration FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE TRIGGER update_org_microsoft_integration_updated_at
  BEFORE UPDATE ON public.org_microsoft_integration
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend booking_requests with meeting and calendar fields
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS meeting_provider text,
  ADD COLUMN IF NOT EXISTS external_meeting_id text,
  ADD COLUMN IF NOT EXISTS meeting_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS meeting_access_policy text DEFAULT 'restricted',
  ADD COLUMN IF NOT EXISTS lobby_policy text DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS organizer_email text,
  ADD COLUMN IF NOT EXISTS meeting_last_error text,
  ADD COLUMN IF NOT EXISTS meeting_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_retry_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calendar_provider text,
  ADD COLUMN IF NOT EXISTS external_calendar_event_id text,
  ADD COLUMN IF NOT EXISTS calendar_sync_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS last_calendar_sync_at timestamptz;
