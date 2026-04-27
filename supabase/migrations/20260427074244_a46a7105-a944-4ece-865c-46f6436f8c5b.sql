-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- M365 authorised emails (defence-in-depth allow-list)
-- ============================================================
CREATE TABLE public.m365_authorised_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.m365_authorised_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage m365 allowlist"
  ON public.m365_authorised_emails
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages m365 allowlist"
  ON public.m365_authorised_emails
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Seed the org account
INSERT INTO public.m365_authorised_emails (email, note)
VALUES ('connect@groundpath.com.au', 'Org Microsoft 365 account')
ON CONFLICT (email) DO NOTHING;

-- Helper: is the calling user authorised for M365?
CREATE OR REPLACE FUNCTION public.is_m365_authorised(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN public.m365_authorised_emails a ON lower(a.email) = lower(u.email)
      WHERE u.id = _user_id
    );
$$;

-- ============================================================
-- Knowledge base: documents and chunks
-- ============================================================
CREATE TABLE public.kb_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'onedrive',         -- onedrive | onenote
  external_id TEXT NOT NULL,                        -- OneDrive item id or OneNote page id
  path TEXT,                                        -- e.g. /Groundpath/SOPs/Supervision.docx
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  etag TEXT,
  last_modified_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',            -- active | stale | deleted | error
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX idx_kb_documents_path ON public.kb_documents (path);
CREATE INDEX idx_kb_documents_status ON public.kb_documents (status);

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read kb documents"
  ON public.kb_documents
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access kb documents"
  ON public.kb_documents
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE TRIGGER update_kb_documents_updated_at
  BEFORE UPDATE ON public.kb_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kb_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.kb_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_kb_chunks_document ON public.kb_chunks (document_id);
-- IVFFlat index for cosine similarity search (built later when data exists)
CREATE INDEX idx_kb_chunks_embedding ON public.kb_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read kb chunks"
  ON public.kb_chunks
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access kb chunks"
  ON public.kb_chunks
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================
-- KB sync history
-- ============================================================
CREATE TABLE public.kb_sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'onedrive',
  triggered_by UUID,
  trigger_kind TEXT NOT NULL DEFAULT 'manual',      -- manual | cron
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',           -- running | success | partial | failed
  files_seen INTEGER NOT NULL DEFAULT 0,
  files_changed INTEGER NOT NULL DEFAULT 0,
  files_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

CREATE INDEX idx_kb_sync_runs_started ON public.kb_sync_runs (started_at DESC);

ALTER TABLE public.kb_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read kb sync runs"
  ON public.kb_sync_runs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access kb sync runs"
  ON public.kb_sync_runs
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================
-- Audit log (every M365 action)
-- ============================================================
CREATE TABLE public.m365_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  function_name TEXT NOT NULL,
  action TEXT NOT NULL,                             -- e.g. 'list_files', 'send_mail', 'create_doc'
  target TEXT,                                      -- e.g. file path, doc id, recipient
  status TEXT NOT NULL,                             -- 'success' | 'error' | 'denied'
  error_message TEXT,
  request_metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_m365_audit_user ON public.m365_audit_log (user_id, created_at DESC);
CREATE INDEX idx_m365_audit_function ON public.m365_audit_log (function_name, created_at DESC);
CREATE INDEX idx_m365_audit_created ON public.m365_audit_log (created_at DESC);

ALTER TABLE public.m365_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read m365 audit log"
  ON public.m365_audit_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role writes m365 audit log"
  ON public.m365_audit_log
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================
-- KB semantic search RPC (admin/service-role callable)
-- ============================================================
CREATE OR REPLACE FUNCTION public.kb_search(
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  min_similarity float DEFAULT 0.65
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  document_name text,
  document_path text,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id            AS chunk_id,
    d.id            AS document_id,
    d.name          AS document_name,
    d.path          AS document_path,
    c.chunk_index   AS chunk_index,
    c.content       AS content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.kb_chunks c
  JOIN public.kb_documents d ON d.id = c.document_id
  WHERE d.status = 'active'
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.kb_search(vector, int, float) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kb_search(vector, int, float) TO authenticated, service_role;
