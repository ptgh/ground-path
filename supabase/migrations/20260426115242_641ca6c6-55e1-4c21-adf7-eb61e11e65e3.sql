-- Secure resources: a curated library of files in the private `resources` bucket
-- that authenticated clients can browse and download. Every download attempt
-- (success or failure) is logged for clinical audit.

-- 1. Catalog of available resources
CREATE TABLE IF NOT EXISTS public.secure_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  storage_path text NOT NULL UNIQUE,
  mime_type text,
  size_bytes integer,
  is_published boolean NOT NULL DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secure_resources ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see published resources only
CREATE POLICY "Authenticated users can view published resources"
  ON public.secure_resources
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admins manage everything
CREATE POLICY "Admins can manage secure resources"
  ON public.secure_resources
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_secure_resources_updated_at
  BEFORE UPDATE ON public.secure_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Audit log of every download attempt
CREATE TABLE IF NOT EXISTS public.secure_resource_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.secure_resources(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  failure_reason text,
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_secure_downloads_user
  ON public.secure_resource_downloads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_secure_downloads_resource
  ON public.secure_resource_downloads(resource_id, created_at DESC);

ALTER TABLE public.secure_resource_downloads ENABLE ROW LEVEL SECURITY;

-- Users can see their own download history
CREATE POLICY "Users can view their own download log"
  ON public.secure_resource_downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can see all
CREATE POLICY "Admins can view all download logs"
  ON public.secure_resource_downloads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- No direct INSERT — only the edge function (service role) writes here.
-- (Absence of INSERT policy + RLS enabled = blocked for anon/authenticated.)

-- 3. Tighten the existing private `resources` bucket: no client-side reads.
-- All access goes through the edge function which mints short-lived signed URLs.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'resources'
  ) THEN
    UPDATE storage.buckets SET public = false WHERE id = 'resources';
  END IF;
END $$;

-- Drop any overly permissive existing policies on the resources bucket
DROP POLICY IF EXISTS "Public read on resources" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read resources" ON storage.objects;

-- Admins can upload/manage resources via the dashboard
CREATE POLICY "Admins can upload secure resource files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resources'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can manage secure resource files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'resources'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'resources'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );