-- Create table to track link health
CREATE TABLE public.link_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'AU',
  is_broken BOOLEAN DEFAULT false,
  status_code INTEGER,
  last_checked TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(url)
);

-- Enable RLS
ALTER TABLE public.link_health ENABLE ROW LEVEL SECURITY;

-- Allow public read access for transparency
CREATE POLICY "Link health is publicly readable"
ON public.link_health
FOR SELECT
USING (true);

-- Only admins can modify link health records
CREATE POLICY "Admins can manage link health"
ON public.link_health
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow service role full access (for edge function)
CREATE POLICY "Service role can manage link health"
ON public.link_health
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_link_health_updated_at
BEFORE UPDATE ON public.link_health
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();