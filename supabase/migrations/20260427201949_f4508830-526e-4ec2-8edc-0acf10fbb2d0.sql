
CREATE TABLE public.m365_integration_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.m365_integration_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "M365 admins can view config"
ON public.m365_integration_config FOR SELECT
TO authenticated
USING (public.is_m365_authorised(auth.uid()));

CREATE POLICY "M365 admins can insert config"
ON public.m365_integration_config FOR INSERT
TO authenticated
WITH CHECK (public.is_m365_authorised(auth.uid()));

CREATE POLICY "M365 admins can update config"
ON public.m365_integration_config FOR UPDATE
TO authenticated
USING (public.is_m365_authorised(auth.uid()))
WITH CHECK (public.is_m365_authorised(auth.uid()));

CREATE POLICY "M365 admins can delete config"
ON public.m365_integration_config FOR DELETE
TO authenticated
USING (public.is_m365_authorised(auth.uid()));

CREATE TRIGGER update_m365_integration_config_updated_at
BEFORE UPDATE ON public.m365_integration_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.m365_integration_config (key, value, description) VALUES
  ('teams.alerts.team_id', 'b62dfe31-ca53-4221-99fd-3d557f9580b2', 'groundpath.com.au team — used for automated bot alerts'),
  ('teams.alerts.channel_id', '19:9d28263bdcfd497a8d6e981807a24232@thread.tacv2', 'ops-alerts channel — dedicated for automated bot traffic'),
  ('microsoft.tenant_id', '5fb44001-b570-49a0-ab04-7883cfc0e22d', 'groundpath.com.au Microsoft 365 tenant ID');
